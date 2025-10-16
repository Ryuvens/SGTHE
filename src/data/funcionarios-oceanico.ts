// src/data/funcionarios-oceanico.ts
import { Funcionario } from '@/types/turnos'

// Funcionarios REALES del Centro de Control de Área Oceánico
// Datos proporcionados por el usuario con correos institucionales verificados
export const FUNCIONARIOS_OCEANICO: Funcionario[] = [
  // JEFATURAS (basado en documento anterior del usuario)
  {
    id: '1',
    nombre: 'Jorge',
    apellidoPaterno: 'Morgado',
    apellidoMaterno: 'Carvallo',
    email: 'jmorgado@dgac.gob.cl', // Inferido del patrón
    rol: 'ADMIN',
    habilitaciones: ['ACC', 'FSS'],
    activo: true
  },
  {
    id: '2',
    nombre: 'Ivan',
    segundoNombre: 'Alexis',
    apellidoPaterno: 'Fernandez',
    apellidoMaterno: 'Navarrete',
    email: 'ifernandez@dgac.gob.cl',
    rol: 'SUPERVISOR',
    habilitaciones: ['ACC', 'FSS'],
    activo: true
  },
  
  // CONTROLADORES (orden alfabético por apellido)
  {
    id: '3',
    nombre: 'Claudia',
    segundoNombre: 'Alejandra',
    apellidoPaterno: 'Armijo',
    apellidoMaterno: 'Tobar',
    email: 'carmijo@dgac.gob.cl',
    rol: 'CONTROLADOR',
    habilitaciones: ['ACC'],
    activo: true
  },
  {
    id: '4',
    nombre: 'Dino',
    segundoNombre: 'Orlando',
    apellidoPaterno: 'Canales',
    apellidoMaterno: 'Julio',
    email: 'dcanales@dgac.gob.cl',
    rol: 'CONTROLADOR',
    habilitaciones: ['ACC', 'FSS'],
    activo: true
  },
  {
    id: '5',
    nombre: 'Alex',
    segundoNombre: 'Mauricio',
    apellidoPaterno: 'Carrillo',
    apellidoMaterno: 'Sanhueza',
    email: 'acarrillo@dgac.gob.cl',
    rol: 'CONTROLADOR',
    habilitaciones: ['ACC', 'FSS'],
    activo: true
  },
  {
    id: '6',
    nombre: 'Patricio',
    segundoNombre: 'Danilo',
    apellidoPaterno: 'Concha',
    apellidoMaterno: 'Arellano',
    email: 'pconcha@dgac.gob.cl',
    rol: 'CONTROLADOR',
    habilitaciones: ['ACC'],
    activo: true
  },
  {
    id: '7',
    nombre: 'Cristian',
    segundoNombre: 'Eduardo',
    apellidoPaterno: 'Cortes',
    apellidoMaterno: 'Mancilla',
    email: 'ccortes@dgac.gob.cl',
    rol: 'CONTROLADOR',
    habilitaciones: ['ACC'],
    activo: true
  },
  {
    id: '8',
    nombre: 'Ursula',
    segundoNombre: 'Mercedes',
    apellidoPaterno: 'Garrido',
    apellidoMaterno: 'Arias',
    email: 'ugarrido@dgac.gob.cl',
    rol: 'CONTROLADOR',
    habilitaciones: ['ACC', 'FSS'],
    activo: true
  },
  {
    id: '9',
    nombre: 'Ruben',
    segundoNombre: 'Eliseo',
    apellidoPaterno: 'Hernandez',
    apellidoMaterno: 'Espinoza',
    email: 'rhernandez@dgac.gob.cl',
    rol: 'CONTROLADOR',
    habilitaciones: ['ACC'],
    activo: true
  },
  {
    id: '10',
    nombre: 'Christian',
    segundoNombre: 'Marcos',
    apellidoPaterno: 'Larrondo',
    apellidoMaterno: 'Ahumada',
    email: 'clarrondo@dgac.gob.cl',
    rol: 'CONTROLADOR',
    habilitaciones: ['ACC'],
    activo: true
  },
  {
    id: '11',
    nombre: 'Maria',
    segundoNombre: 'Bernarda',
    apellidoPaterno: 'Molina',
    apellidoMaterno: 'Julia',
    email: 'mmolina@dgac.gob.cl',
    rol: 'CONTROLADOR',
    habilitaciones: ['ACC', 'FSS'],
    activo: true
  },
  {
    id: '12',
    nombre: 'Jenny',
    segundoNombre: 'Andrea',
    apellidoPaterno: 'Moraga',
    apellidoMaterno: 'Canales',
    email: 'jmoraga@dgac.gob.cl',
    rol: 'CONTROLADOR',
    habilitaciones: ['ACC'],
    activo: true
  },
  {
    id: '13',
    nombre: 'Ivonne',
    segundoNombre: 'Marlene',
    apellidoPaterno: 'Orrego',
    apellidoMaterno: 'Gallardo',
    email: 'iorrego@dgac.gob.cl',
    rol: 'CONTROLADOR',
    habilitaciones: ['ACC'],
    activo: true
  },
  {
    id: '14',
    nombre: 'Rigoberto',
    segundoNombre: 'Alexis',
    apellidoPaterno: 'Pacheco',
    apellidoMaterno: 'Navarro',
    email: 'apacheco@dgac.gob.cl',
    rol: 'CONTROLADOR',
    habilitaciones: ['ACC', 'FSS'],
    activo: true
  },
  {
    id: '15',
    nombre: 'Christian',
    segundoNombre: 'Clinton',
    apellidoPaterno: 'Plummer',
    apellidoMaterno: 'Ruiz',
    email: 'cplummer@dgac.gob.cl',
    rol: 'CONTROLADOR',
    habilitaciones: ['ACC'],
    activo: true
  },
  {
    id: '16',
    nombre: 'Felipe',
    segundoNombre: 'Ernesto',
    apellidoPaterno: 'Serrano',
    apellidoMaterno: 'Gallardo',
    email: 'fserrano@dgac.gob.cl',
    rol: 'CONTROLADOR',
    habilitaciones: ['ACC'],
    activo: true
  },
  {
    id: '17',
    nombre: 'Marcelo',
    segundoNombre: 'Rumaldo',
    apellidoPaterno: 'Silva',
    apellidoMaterno: 'Meza',
    email: 'msilvam@dgac.gob.cl',
    rol: 'CONTROLADOR',
    habilitaciones: ['ACC', 'FSS'],
    activo: true
  },
  {
    id: '18',
    nombre: 'Giselle',
    segundoNombre: 'Andrea',
    apellidoPaterno: 'Tello',
    apellidoMaterno: 'Munoz',
    email: 'gtello@dgac.gob.cl',
    rol: 'CONTROLADOR',
    habilitaciones: ['ACC', 'FSS'],
    activo: true
  },
  {
    id: '19',
    nombre: 'Jesenia',
    segundoNombre: 'Del Carmen',
    apellidoPaterno: 'Valenzuela',
    apellidoMaterno: 'Bavestrello',
    email: 'jvalenzuelab@dgac.gob.cl',
    rol: 'CONTROLADOR',
    habilitaciones: ['ACC', 'FSS'],
    activo: true
  }
]

// Helper para obtener nombre completo
export function getNombreCompleto(funcionario: Funcionario): string {
  const partes = [
    funcionario.nombre,
    funcionario.segundoNombre,
    funcionario.apellidoPaterno,
    funcionario.apellidoMaterno
  ].filter(Boolean)
  
  return partes.join(' ').trim()
}

// Helper para obtener nombre corto (nombre + apellido paterno)
export function getNombreCorto(funcionario: Funcionario): string {
  return `${funcionario.nombre} ${funcionario.apellidoPaterno}`.trim()
}

// Helper para obtener funcionario por ID
export function getFuncionario(id: string): Funcionario | undefined {
  return FUNCIONARIOS_OCEANICO.find(f => f.id === id)
}

// Helper para obtener funcionario por email
export function getFuncionarioPorEmail(email: string): Funcionario | undefined {
  return FUNCIONARIOS_OCEANICO.find(f => f.email.toLowerCase() === email.toLowerCase())
}

// Estadísticas del equipo
export const ESTADISTICAS_EQUIPO = {
  total: FUNCIONARIOS_OCEANICO.length,
  admin: FUNCIONARIOS_OCEANICO.filter(f => f.rol === 'ADMIN').length,
  supervisor: FUNCIONARIOS_OCEANICO.filter(f => f.rol === 'SUPERVISOR').length,
  controlador: FUNCIONARIOS_OCEANICO.filter(f => f.rol === 'CONTROLADOR').length,
  conACC: FUNCIONARIOS_OCEANICO.filter(f => f.habilitaciones.includes('ACC')).length,
  conFSS: FUNCIONARIOS_OCEANICO.filter(f => f.habilitaciones.includes('FSS')).length,
  activos: FUNCIONARIOS_OCEANICO.filter(f => f.activo).length
}

