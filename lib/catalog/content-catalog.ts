export interface ClaseCatalogEntry {
  claseId: number
  moduloId: number
  title: string
  route: string
}

export interface ModuloCatalogEntry {
  moduloId: number
  title: string
}

const MODULO_CATALOG: ModuloCatalogEntry[] = [
  { moduloId: 0, title: 'Tutorial' },
  { moduloId: 1, title: 'La Diabetes' },
  { moduloId: 2, title: 'La Insulinoterapia' },
  { moduloId: 3, title: 'Control de la glucosa' },
]

const CLASE_CATALOG: ClaseCatalogEntry[] = [
  { claseId: 0, moduloId: 0, title: 'Tutorial', route: '/modulos/tutorial-conjunto' },
  { claseId: 1, moduloId: 1, title: 'El Pancreas', route: '/modulos/la-diabetes-clase-1' },
  { claseId: 2, moduloId: 1, title: 'La diabetes', route: '/modulos/la-diabetes-clase-2' },
  { claseId: 3, moduloId: 1, title: 'Los Tipos de Diabetes', route: '/modulos/la-diabetes-clase-3' },
  { claseId: 4, moduloId: 1, title: 'Sintomas de la DIabetes', route: '/modulos/la-diabetes-clase-4' },
  { claseId: 5, moduloId: 2, title: 'Introduccion', route: '/modulos/la-insulinoterapia-clase-5' },
  { claseId: 6, moduloId: 2, title: 'Los dos tipos de insulina', route: '/modulos/la-insulinoterapia-clase-6' },
  { claseId: 7, moduloId: 2, title: 'Dentro de los tipos de insulina', route: '/modulos/la-insulinoterapia-clase-7' },
  { claseId: 8, moduloId: 2, title: 'Métodos de administración', route: '/modulos/la-insulinoterapia-clase-8' },
  { claseId: 9, moduloId: 3, title: 'Como medir la glucosa', route: '/modulos/modulo-3-clase-9' },
  { claseId: 10, moduloId: 3, title: 'Hipoglucemia y hiperglucemia', route: '/modulos/modulo-3-clase-10' },
  { claseId: 11, moduloId: 3, title: 'Cuidados practicos de la insulinoterapia', route: '/modulos/modulo-3-clase-11' },
  { claseId: 12, moduloId: 3, title: 'Objetivos glucemicos', route: '/modulos/modulo-3-clase-12' },
]

export const CONTENT_MODULE_IDS = [1, 2, 3] as const

export function getModuloCatalogEntry({ moduloId }: { moduloId: number }) {
  return MODULO_CATALOG.find(entry => entry.moduloId === moduloId) ?? null
}

export function getClaseCatalogEntry({ claseId }: { claseId: number }) {
  return CLASE_CATALOG.find(entry => entry.claseId === claseId) ?? null
}

export function getClaseRoute({ claseId }: { claseId: number }) {
  return getClaseCatalogEntry({ claseId })?.route ?? null
}
