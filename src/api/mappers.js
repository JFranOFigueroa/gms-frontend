/** Las vistas se mantienen intactas: aquí se traduce JDBC snake_case / JPA camelCase. */
const pick = (row, camel, snake, fallback = null) => row?.[camel] ?? row?.[snake] ?? fallback;
const asMoney = (v) => Number(v ?? 0);
const asDate = (v) => v ? String(v).slice(0, 10) : null;
export const mapGym = (g) => ({
  id: g.id, name: g.name, slug: g.slug, shortName: g.shortName || g.short_name || g.name,
  address: g.address || '', phone: g.phone || '', logo: g.logoUrl || g.logo_url || null,
  status: g.status, active: g.status === 'active', createdAt: asDate(g.createdAt || g.created_at),
});
export const mapMember = (m) => ({
  id: m.id, userId: pick(m, 'userId', 'user_id'), gymId: pick(m, 'gymId', 'gym_id'),
  code: m.code ?? m.memberCode, name: m.name || '', email: String(m.email || ''),
  phone: m.phone || '', birthDate: asDate(pick(m, 'birthDate', 'birth_date')),
  address: m.address || '', emergencyContactName: pick(m, 'emergencyContactName', 'emergency_contact_name', ''),
  emergencyContactPhone: pick(m, 'emergencyContactPhone', 'emergency_contact_phone', ''),
  photo: pick(m, 'photoUrl', 'photo_url'), photoAssetId: pick(m, 'photoAssetId', 'photo_asset_id'),
  startDate: asDate(pick(m, 'startDate', 'start_date')), paymentModality: pick(m, 'paymentModality', 'payment_modality'),
  lastPaymentDate: asDate(pick(m, 'lastPaymentDate', 'last_payment_date')),
  nextPaymentDate: asDate(pick(m, 'nextPaymentDate', 'next_payment_date')),
  active: pick(m, 'active', 'is_active', false) === true, accessStatus: m.accessStatus ?? null, notes: m.notes || '',
  createdAt: asDate(pick(m, 'createdAt', 'created_at')),
});
export const mapPayment = (p) => ({
  id: p.id, gymId: pick(p, 'gymId', 'gym_id'), memberId: pick(p, 'memberId', 'member_id'),
  amount: asMoney(p.amount), method: p.method, concept: p.concept,
  periodicity: p.periodicity, periods: p.periods,
  paidAt: String(pick(p, 'paidAt', 'paid_at', '')).slice(0, 10),
  periodStart: asDate(pick(p, 'periodStart', 'period_start')),
  nextPaymentDate: asDate(pick(p, 'nextDueDate', 'next_due_date')),
  notes: p.notes || '', createdAt: pick(p, 'createdAt', 'created_at'),
});
export const mapPlan = (p) => ({ ...p, billingPeriod: p.billingPeriod || p.billing_period,
  intervalCount: p.intervalCount ?? p.interval_count ?? 1, price: asMoney(p.price), active: p.isActive ?? p.is_active ?? true });
export const mapStaff = (u) => ({ ...u, name: u.name || u.fullName || u.full_name || '', gymId: pick(u, 'gymId', 'gym_id'),
  role: u.role || u.roles?.[0] || '', roles: u.roles || [u.role].filter(Boolean),
  active: u.status === 'active', gymIds: [pick(u, 'gymId', 'gym_id')].filter(Boolean) });
export const mapProduct = (p) => ({ ...p, gymId: p.gymId || p.gym_id,
  price: asMoney(p.price), stock: Number(p.stock || 0), active: p.isActive ?? p.is_active ?? true });
export const mapSale = (s) => ({
  id: s.id, gymId: s.gymId, total: asMoney(s.total), createdBy: s.soldBy,
  createdAt: s.soldAt, status: s.status,
  items: (s.items || []).map(i => ({ id: i.id, productId: i.productId,
    name: i.productName, qty: i.quantity, price: asMoney(i.unitPrice), total: asMoney(i.lineTotal) })),
});
export const mapRoutine = (r) => ({ ...r, days: (r.days || []).map(d => ({
  day: d.day, exercises: (d.exercises || []).map(ex => ({ ...ex })) })), published: r.published === true });
function localParts(value) {
  const d = new Date(value);
  if (!value || Number.isNaN(d.getTime())) return { date: '', time: '' };
  const pad = n => String(n).padStart(2,'0');
  return { date: `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}` };
}
export const mapClass = (c) => {
  const startsAt = pick(c,'startsAt','starts_at'); const endsAt = pick(c,'endsAt','ends_at');
  const from = localParts(startsAt), to = localParts(endsAt);
  return { id:c.id, gymId:pick(c,'gymId','gym_id'), templateId:pick(c,'templateId','template_id'),
    name:c.name, category:c.category, color:c.color, capacity:c.capacity,
    date:from.date, startTime:from.time, endTime:to.time, startsAt, endsAt,
    attendees:[], status:c.status, trainerUserId:pick(c,'trainerUserId','trainer_user_id') };
};
export const mapTemplate = (t) => ({ ...t, gymId:pick(t,'gymId','gym_id'),
  duration:pick(t,'durationMinutes','duration_minutes', 60), category:t.category || 'normal' });
export const mapReservation = (r) => ({ id:r.id, classId:pick(r,'classId','class_id'),
  userId:pick(r,'userId','user_id'), status:r.status, bookedAt:pick(r,'bookedAt','booked_at') });
export const mapCheckin = (e) => ({
  id:e.id, gymId:pick(e,'gymId','gym_id'),
  userId:pick(e,'memberId','member_id') || pick(e,'staffUserId','staff_user_id') || pick(e,'guestPassId','guest_pass_id'),
  userName:(() => {
    const name = pick(e, 'displayName', 'display_name') || pick(e, 'memberName', 'member_name') ||
      pick(e, 'staffName', 'staff_name');
    // Nunca convertir claves técnicas en nombres visibles.
    if (typeof name === 'string' && name.trim() &&
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(name.trim())) return name.trim();
    return pick(e,'memberId','member_id') ? 'Miembro' :
      pick(e,'staffUserId','staff_user_id') ? 'Personal' : 'Acceso sin identificar';
  })(),
  role:pick(e,'memberId','member_id') ? 'member' : pick(e,'staffUserId','staff_user_id') ? 'staff' : 'guest',
  allowed:e.allowed === true, method:e.method, reason:pick(e,'reasonCode','reason_code',''),
  timestamp:pick(e,'occurredAt','occurred_at'),
});
export const mapBlock = (b) => ({ id:b.id, gymId:pick(b,'gymId','gym_id'),
  type:pick(b,'blockType','block_type',b.type), order:pick(b,'sortOrder','sort_order',b.order ?? 0),
  enabled:b.enabled !== false, data:pick(b,'blockData','block_data',b.data || {}) });
export const mapMedia = (m) => ({ id:m.id, gymId:pick(m,'gymId','gym_id'),
  name:m.name, type:pick(m,'mediaType','media_type'),
  url:pick(m,'externalUrl','external_url') || null,
  contentUrl:pick(m,'contentUrl','content_url'), mimeType:pick(m,'mimeType','mime_type'),
  byteSize:pick(m,'byteSize','byte_size') });
export const asModuleMap = (rows) => Object.fromEntries((rows || []).map(m =>
  [pick(m,'moduleKey','module_key'),m.enabled === true]));
