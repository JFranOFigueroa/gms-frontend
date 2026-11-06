import { defineStore } from 'pinia';
import { api } from '@/api/service';
import { mapCheckin } from '@/api/mappers';
import { useGymsStore } from './useGymsStore';
import { useIntegrationStore } from './useIntegrationStore';
import { toDateOnly } from '@/utils/date';
const today = () => toDateOnly(new Date());
const unavailable = { ok:false, allowed:false, reason:'El registro mediante código manual no está disponible.' };

export const useCheckinStore = defineStore('checkin', {
  state: () => ({
    activeToken: null, tokenExpiresAt: null, allCheckins: [], ownCheckins: [],
    // Sesión de dispositivo independiente: jamás se mezcla con la sesión JWT.
    kioskConfig: null, kioskSession: null, kioskSessionSlug: null, kioskEpoch: 0,
    kioskState: 'loading', kioskCsrf: null, currentGymQr: null,
    currentMemberQr: null, lastDecision: null, checkinStats: null,
    // V6: el código personal vive solo en memoria y se descarta al salir o cambiar de gym.
    currentManualCode: null, manualCodeEpoch: 0,
    isSubmitting: false,
  }),
  getters: {
    tokenIsValid: () => false, // No son válidos los antiguos tokens sintéticos.
    checkins: s => s.allCheckins.filter(c => c.gymId === useGymsStore().activeGymId),
    todaysCheckins() { return this.checkins.filter(c => c.timestamp && toDateOnly(new Date(c.timestamp)) === today()); },
    grantedToday() { return this.todaysCheckins.filter(c => c.allowed); },
    deniedToday() { return this.todaysCheckins.filter(c => !c.allowed); },
    stats() { return { total:this.checkins.length, today:this.todaysCheckins.length,
      granted:this.grantedToday.length, denied:this.deniedToday.length }; },
  },
  actions: {
    async load(gym = useGymsStore().activeGymId) {
      if (!gym) { this.allCheckins = []; return; }
      const rows = await useIntegrationStore().track('check-in', () => api.checkins.list(gym));
      if (gym === useGymsStore().activeGymId) this.allCheckins = rows.map(mapCheckin);
    },
    async loadMine(gym = useGymsStore().activeGymId, params = { limit:100 }) {
      this.ownCheckins = [];
      if (!gym) return;
      const result = await useIntegrationStore().track('mis accesos', () => api.checkins.mine(gym, params));
      if (gym === useGymsStore().activeGymId) this.ownCheckins = (result.items || []).map(e => ({
        id:e.eventId, timestamp:e.occurredAt, visitDate:e.visitDate,
        allowed:e.allowed, method:e.method, reason:e.reason,
      }));
      return this.ownCheckins;
    },
    async manualCheckin(memberId) {
      const gym = useGymsStore().activeGymId;
      const event = await useIntegrationStore().track('check-in', () => api.checkins.manual(gym, memberId));
      await this.load(gym);
      return { ok:event.allowed, allowed:event.allowed, reason:event.reason, event };
    },
    clearKioskState() {
      this.kioskEpoch++;
      this.kioskConfig = null; this.kioskSession = null; this.kioskSessionSlug = null;
      this.kioskCsrf = null; this.kioskState = 'loading'; this.currentGymQr = null;
      this.lastDecision = null;
    },
    async loadKioskConfig(slug) {
      const epoch = this.kioskEpoch;
      const data = await api.kiosk.publicConfig(slug);
      if (epoch === this.kioskEpoch) {
        this.kioskConfig = data;
        if (!data?.checkinAvailable) this.kioskState = 'disabled';
      }
      return data;
    },
    async loadKioskSession() {
      const epoch = this.kioskEpoch;
      try {
        const session = await api.kiosk.session();
        if (!session?.csrfToken) throw new Error('No se pudo validar la sesión del dispositivo.');
        if (epoch === this.kioskEpoch) {
          this.kioskSession = session;
          this.kioskCsrf = session.csrfToken;
          this.kioskState = 'ready';
        }
        return session;
      } catch (error) {
        if (epoch === this.kioskEpoch) {
          this.kioskSession = null; this.kioskCsrf = null; this.currentGymQr = null;
          this.kioskState = error.status === 401 ? 'needs_activation' : 'error';
        }
        if (error.status !== 401) throw error;
        return null;
      }
    },
    async activateKiosk(slug, activationCode) {
      const epoch = this.kioskEpoch;
      await api.kiosk.activate(slug, activationCode); // 204 sin cuerpo
      if (epoch !== this.kioskEpoch) return null;
      this.kioskSessionSlug = slug; // Memoria de esta pantalla, no identidad de la cookie.
      return this.loadKioskSession();
    },
    async logoutKiosk() {
      const csrf = this.kioskCsrf;
      try { if (csrf) await api.kiosk.logout(csrf); }
      finally { this.clearKioskState(); this.kioskState = 'needs_activation'; }
    },
    async issueGymQr() {
      const epoch = this.kioskEpoch;
      if (this.kioskState !== 'ready' || !this.kioskCsrf) throw new Error('Activa el dispositivo antes de continuar.');
      try {
        const result = await api.kiosk.issueGymQr(this.kioskCsrf);
        if (!result?.qrValue || !result?.expiresAt) throw new Error('No se recibió un QR válido del servidor.');
        return result;
      } catch (error) {
        this.currentGymQr = null;
        if (epoch === this.kioskEpoch && [401,403].includes(error.status)) {
          this.kioskState = 'needs_activation'; this.kioskCsrf = null; this.kioskSession = null;
        }
        throw error;
      }
    },
    async scanMemberQr(memberQr, idempotencyKey) {
      const epoch = this.kioskEpoch;
      if (this.isSubmitting) return null;
      if (this.kioskState !== 'ready' || !this.kioskCsrf) throw new Error('Activa el dispositivo antes de continuar.');
      this.isSubmitting = true;
      try {
        const result = await api.kiosk.scanMemberQr(memberQr, idempotencyKey, this.kioskCsrf);
        if (epoch === this.kioskEpoch) this.lastDecision = result;
        return result;
      } catch (error) {
        if (epoch === this.kioskEpoch && [401,403].includes(error.status)) {
          this.kioskState = 'needs_activation'; this.kioskCsrf = null;
          this.kioskSession = null; this.currentGymQr = null;
        }
        throw error;
      } finally { this.isSubmitting = false; }
    },
    async validateManualCode(accessCode, idempotencyKey) {
      const epoch = this.kioskEpoch;
      if (this.isSubmitting) return null;
      if (this.kioskState !== 'ready' || !this.kioskCsrf || !this.kioskSession?.slug ||
          !this.kioskConfig?.checkinAvailable || this.kioskSession.slug !== this.kioskConfig.slug) {
        throw new Error('El dispositivo no corresponde a este gimnasio o debe activarse.');
      }
      this.isSubmitting = true;
      try {
        const decision = await api.kiosk.validateCode(accessCode, idempotencyKey, this.kioskCsrf);
        if (epoch === this.kioskEpoch) this.lastDecision = decision;
        return decision;
      } catch (error) {
        if (epoch === this.kioskEpoch && [401, 403].includes(error.status)) {
          this.kioskState = 'needs_activation'; this.kioskCsrf = null;
          this.kioskSession = null; this.currentGymQr = null;
        }
        throw error;
      } finally { this.isSubmitting = false; }
    },
    async scanGymQr(gym, kioskToken, idempotencyKey) {
      if (this.isSubmitting) return null;
      this.isSubmitting = true;
      try {
        const result = await api.checkins.scanGymQr(gym, kioskToken, idempotencyKey);
        if (useGymsStore().activeGymId === gym) this.lastDecision = result;
        return result;
      } finally { this.isSubmitting = false; }
    },
    async issueMyQr(gym) {
      const result = await api.checkins.issueMyQr(gym);
      if (!result?.qrValue || !result?.expiresAt) throw new Error('No se recibió una credencial válida.');
      return result;
    },
    clearManualCode() {
      this.manualCodeEpoch++;
      this.currentManualCode = null;
    },
    async issueMyCode(gym) {
      const epoch = ++this.manualCodeEpoch;
      this.currentManualCode = null;
      const data = await api.checkins.issueMyCode(gym);
      if (!data?.accessCode || !data?.expiresAt || !data?.serverTime) {
        throw new Error('No se recibió un código temporal válido.');
      }
      if (epoch !== this.manualCodeEpoch || gym !== useGymsStore().activeGymId) return null;
      this.currentManualCode = {
        accessCode: data.accessCode, expiresAt: data.expiresAt, serverTime: data.serverTime,
      };
      return this.currentManualCode;
    },
    async loadStats(gym, params) {
      const result = await api.checkins.stats(gym, params);
      if (gym === useGymsStore().activeGymId) this.checkinStats = result;
      return result;
    },
    // Métodos heredados sintéticos siguen sin autorizar check-ins. V6 usa issueMyCode/validateManualCode.
    generateToken() { return { token:null, expiresAt:null, reason:unavailable.reason }; },
    ensureActiveToken() { return this.generateToken(); },
    validateToken() { return false; },
    isKioskTokenValid() { return false; },
    hasCheckedInToday(id) { return this.grantedToday.some(c => String(c.userId) === String(id)); },
    recordAccess() { return unavailable; },
    checkIn() { return unavailable; },
    registerAccess() { return unavailable; },
  },
});
