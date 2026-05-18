export const createBlock = (config, order) => {
  return {
    id: Date.now(),

    type: config.type,

    enabled: true,

    order,

    data: structuredClone(config.defaultData),
  }
}
