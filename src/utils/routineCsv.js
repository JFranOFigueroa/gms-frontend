// El formato es intencionalmente estricto: coincide con la plantilla descargable.
export const ROUTINE_CSV_HEADERS = ['dia', 'ejercicio', 'series', 'repeticiones', 'descanso', 'notas']

function readCsvRows(value) {
  const text = String(value ?? '').replace(/^\uFEFF/, '')
  const rows = []
  let row = []
  let field = ''
  let quoted = false
  let closedQuote = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"'
        i++
      } else if (char === '"') {
        quoted = false
        closedQuote = true
      } else {
        field += char
      }
      continue
    }
    if (char === '"' && field === '' && !closedQuote) {
      quoted = true
    } else if (char === ',') {
      row.push(field)
      field = ''
      closedQuote = false
    } else if (char === '\r' || char === '\n') {
      if (char === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      if (row.some((cell) => cell.trim() !== '')) rows.push(row)
      row = []
      field = ''
      closedQuote = false
    } else if (closedQuote && char !== ' ' && char !== '\t') {
      throw new Error('El CSV contiene caracteres después de una comilla de cierre.')
    } else if (char !== '"') {
      field += char
    } else {
      throw new Error('El CSV contiene comillas sin escapar.')
    }
  }
  if (quoted) throw new Error('El CSV tiene una celda con comillas sin cerrar.')
  row.push(field)
  if (row.some((cell) => cell.trim() !== '')) rows.push(row)
  return rows
}

export function parseRoutineCsv(content) {
  const rows = readCsvRows(content)
  const headers = rows[0]?.map((value) => value.trim())
  if (
    !headers ||
    headers.length !== ROUTINE_CSV_HEADERS.length ||
    !headers.every((header, index) => header === ROUTINE_CSV_HEADERS[index])
  ) {
    throw new Error(`El CSV debe tener exactamente estas columnas y en este orden: ${ROUTINE_CSV_HEADERS.join(', ')}.`)
  }
  if (rows.length === 1) throw new Error('El CSV no contiene ejercicios para importar.')

  const days = []
  const byDay = new Map()
  for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex]
    const line = rowIndex + 1
    if (row.length !== ROUTINE_CSV_HEADERS.length) {
      throw new Error(`Fila ${line}: debe tener exactamente seis columnas, incluyendo notas aunque estén vacías.`)
    }
    const [day, name, sets, reps, rest, notes] = row.map((value) => value.trim())
    if (!day || !name || !sets || !reps || !rest) {
      throw new Error(`Fila ${line}: día, ejercicio, series, repeticiones y descanso son obligatorios.`)
    }
    if (!/^[1-9]\d*$/.test(sets)) {
      throw new Error(`Fila ${line}: series debe ser un número entero mayor que cero.`)
    }
    const key = day.toLocaleLowerCase('es')
    let item = byDay.get(key)
    if (!item) {
      item = { day, exercises: [] }
      byDay.set(key, item)
      days.push(item)
    }
    item.exercises.push({ name, sets, reps, rest, notes })
  }
  return { days, exerciseCount: rows.length - 1 }
}
