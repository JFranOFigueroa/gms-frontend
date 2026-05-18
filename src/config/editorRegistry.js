import HeroBlockEditor from '@/components/dashboard/editors/HeroBlockEditor.vue'

import TextBlockEditor from '@/components/dashboard/editors/TextBlockEditor.vue'

import MembershipBlockEditor from '@/components/dashboard/editors/MembershipBlockEditor.vue'

import CarouselBlockEditor from '@/components/dashboard/editors/CarouselBlockEditor.vue'

export const editorRegistry = {
  hero: HeroBlockEditor,

  text: TextBlockEditor,

  membership: MembershipBlockEditor,

  carousel: CarouselBlockEditor,
}
