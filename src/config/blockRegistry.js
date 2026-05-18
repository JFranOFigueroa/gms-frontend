export const blockRegistry = [
  {
    type: 'hero',

    label: 'Hero Block',

    description: 'Banner principal fullscreen',

    preview: '🖼️',

    defaultData: {
      badge: 'GMS FITNESS',

      title: 'Transforma tu cuerpo y mente',

      subtitle: 'Entrena con coaches profesionales.',

      slides: [],
    },
  },

  {
    type: 'text',

    label: 'Text Block',

    description: 'Texto informativo',

    preview: '📝',

    defaultData: {
      title: 'Nuevo bloque',

      subtitle: 'Subtítulo del bloque',

      text: 'Contenido editable...',

      align: 'center',

      maxWidth: '4xl',

      background: false,
    },
  },

  {
    type: 'membership',

    label: 'Membership Block',

    description: 'Planes y membresías',

    preview: '💳',

    defaultData: {
      title: 'Nuestros Planes',

      subtitle: 'Elige la membresía ideal para ti.',

      plans: [
        {
          id: 1,

          name: 'Básico',

          price: '$499',

          featured: false,

          benefits: ['Acceso general', 'Área de cardio', 'Pesas libres'],
        },

        {
          id: 2,

          name: 'Pro',

          price: '$899',

          featured: true,

          benefits: ['Acceso total', 'Clases grupales', 'Coach personalizado'],
        },
      ],
    },
  },

  {
    type: 'carousel',

    label: 'Carousel Block',

    description: 'Galería de imágenes',

    preview: '🎞️',

    defaultData: {
      slides: [],
      align: 'center',
    },
  },
]
