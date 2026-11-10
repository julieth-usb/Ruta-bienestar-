/* Catálogo simulado de servicios de apoyo estudiantil.
   Contenido elaborado para el prototipo académico de Ruta Bienestar. */

window.RUTA_SERVICES = [
  {
    id: "academico",
    name: "Asesoría académica y tutorías",
    category: "Académico",
    icon: "book",
    tone: "mint",
    short: "Refuerza tus materias con tutorías y acompañamiento personalizado.",
    description: "Un equipo de docentes y monitores te ayuda a entender los temas que se te dificultan, organizar tu estudio y recuperar la confianza en tu proceso académico. La asesoría se adapta a tu programa y a tu ritmo.",
    forYou: [
      "Sientes que una materia se te está complicando.",
      "Perdiste un parcial o no entregaste una actividad a tiempo.",
      "Necesitas organizar tu tiempo o mejorar tus técnicas de estudio.",
      "Estás en primer semestre y quieres empezar con bases firmes."
    ],
    steps: [
      "Cuéntanos qué materia y qué tema necesitas reforzar.",
      "Te asignamos un tutor según tu programa y disponibilidad.",
      "Asistes a tu sesión virtual o presencial y defines el siguiente paso."
    ],
    duration: "45 min",
    modality: "Virtual o presencial",
    requires: "Cita previa",
    schedule: "Lunes a viernes, 7:00 a. m. – 6:00 p. m.",
    place: "Bloque de Bienestar, piso 2 · Sede Cúcuta",
    contact: "bienestar.academico@unisimon.edu.co",
    tags: ["Gratuito", "Virtual o presencial", "Primer semestre"],
    cta: "Agendar tutoría",
    note: "Puedes venir solo o con un compañero. No necesitas tener todo claro para pedir la cita.",
    keywords: "materia nota parcial tutor monitoria estudiar examen profe universidad aprender"
  },
  {
    id: "psicologia",
    name: "Apoyo psicológico",
    category: "Emocional",
    icon: "heart",
    tone: "teal",
    short: "Espacios seguros y confidenciales para hablar de lo que sientes.",
    description: "Profesionales de psicología te escuchan sin juzgar y te acompañan a encontrar herramientas para atravesar momentos difíciles. El servicio es gratuito, confidencial y no necesita diagnóstico previo.",
    forYou: [
      "Sientes ansiedad, estrés o tristeza con frecuencia.",
      "Estás atravesando una crisis familiar, académica o personal.",
      "Necesitas hablar con alguien de confianza fuera de tu círculo.",
      "Quieres aprender a manejar mejor tus emociones."
    ],
    steps: [
      "Solicita tu cita sin tener que contar detalles por adelantado.",
      "Elige si prefieres atención virtual o presencial.",
      "Un profesional te acompaña en un espacio seguro y confidencial."
    ],
    duration: "45–60 min",
    modality: "Virtual o presencial",
    requires: "Cita previa",
    schedule: "Lunes a viernes, 7:00 a. m. – 5:00 p. m. · Atención prioritaria",
    place: "Bloque de Bienestar, piso 1 · Sede Cúcuta",
    contact: "bienestar.psicologia@unisimon.edu.co",
    tags: ["Gratuito", "Confidencial", "Prioritario"],
    cta: "Agendar cita",
    note: "Lo que compartas con el equipo de psicología es confidencial. Si estás en una emergencia, llama al 123.",
    keywords: "psicologia ansiedad ansioso triste depresion estres emocional salud mental hablar crisis acompanamiento"
  },
  {
    id: "becas",
    name: "Becas y auxilios",
    category: "Económico",
    icon: "wallet",
    tone: "gold",
    short: "Encuentra el apoyo económico y los auxilios que se ajustan a ti.",
    description: "Aquí encuentras las convocatorias de becas, descuentos y auxilios disponibles, los requisitos explicados sin tecnicismos y el paso a paso para radicar tu solicitud sin perder fechas.",
    forYou: [
      "Tu situación económica cambió y necesitas apoyo para continuar.",
      "No sabes si calificas para una beca o auxilio.",
      "Tienes dudas sobre documentos, fechas o requisitos.",
      "Quieres conocer otras opciones de financiación."
    ],
    steps: [
      "Revisa las convocatorias abiertas y sus requisitos.",
      "Prepara los documentos con ayuda de un asesor.",
      "Radica tu solicitud y recibe el seguimiento por WhatsApp."
    ],
    duration: "30 min",
    modality: "Virtual o presencial",
    requires: "Cita previa",
    schedule: "Lunes a viernes, 8:00 a. m. – 5:00 p. m.",
    place: "Oficina de Admisiones y Registro · Sede Cúcuta",
    contact: "becas@unisimon.edu.co",
    tags: ["Gratuito", "Convocatoria 2027", "Acompañamiento"],
    cta: "Agendar asesoría",
    note: "La convocatoria 2027 cierra el 15 de noviembre. Un asesor puede revisar tu caso antes de radicar.",
    keywords: "beca auxilio plata dinero economico matricula descuento convocatoria requisitos financiacion"
  },
  {
    id: "profesional",
    name: "Orientación profesional",
    category: "Profesional",
    icon: "compass",
    tone: "sky",
    short: "Descubre tus fortalezas y define tus próximos pasos.",
    description: "Un espacio para explorar tus intereses, revisar tu hoja de vida, prepararte para entrevistas y tomar decisiones sobre tu futuro profesional con información y acompañamiento.",
    forYou: [
      "No sabes qué hacer al terminar el semestre o la carrera.",
      "Quieres mejorar tu hoja de vida o prepararte para una entrevista.",
      "Dudas entre varias opciones de práctica o especialización.",
      "Quieres identificar tus fortalezas y áreas de mejora."
    ],
    steps: [
      "Agenda una sesión individual.",
      "Completa un ejercicio breve de intereses y fortalezas.",
      "Construye un plan de acción con tu orientador."
    ],
    duration: "50 min",
    modality: "Virtual o presencial",
    requires: "Cita previa",
    schedule: "Martes y jueves, 9:00 a. m. – 5:00 p. m.",
    place: "Bloque de Bienestar, piso 2 · Sede Cúcuta",
    contact: "orientacion.profesional@unisimon.edu.co",
    tags: ["Gratuito", "Hoja de vida", "Entrevistas"],
    cta: "Agendar orientación",
    note: "Puedes traer tu hoja de vida o tus dudas sobre práctica, empleo o posgrado.",
    keywords: "futuro carrera profesional empleo hoja de vida entrevista practica posgrado que hacer"
  },
  {
    id: "emprendimiento",
    name: "Emprendimiento e innovación",
    category: "Emprendimiento",
    icon: "rocket",
    tone: "lime",
    short: "Convierte tu idea en un proyecto con mentoría y acompañamiento.",
    description: "Acompañamiento para pasar de una idea a un prototipo, validar tu modelo de negocio y conectar con mentores, laboratorios y convocatorias de financiación.",
    forYou: [
      "Tienes una idea pero no sabes por dónde empezar.",
      "Quieres validar un proyecto con usuarios reales.",
      "Necesitas mentores o herramientas para prototipar.",
      "Buscas convocatorias de emprendimiento universitario."
    ],
    steps: [
      "Cuéntanos tu idea en una sesión inicial.",
      "Define el problema, el usuario y el primer prototipo.",
      "Conecta con mentores, laboratorios y convocatorias."
    ],
    duration: "45 min",
    modality: "Presencial",
    requires: "Cita previa",
    schedule: "Miércoles, 2:00 p. m. – 6:00 p. m.",
    place: "Laboratorio de Innovación · Sede Cúcuta",
    contact: "emprendimiento@unisimon.edu.co",
    tags: ["Gratuito", "Mentoría", "Prototipos"],
    cta: "Agendar mentoría",
    note: "No necesitas tener una empresa: puedes llegar solo con una pregunta o una idea inicial.",
    keywords: "emprender negocio idea proyecto innovacion startup mentor emprendimiento"
  },
  {
    id: "inclusion",
    name: "Inclusión y diversidad",
    category: "Inclusión",
    icon: "accessibility",
    tone: "mint",
    short: "Acompañamiento para aprender sin barreras y con los ajustes que necesitas.",
    description: "Un equipo interdisciplinario orienta ajustes razonables, apoyos para la permanencia y rutas de atención para estudiantes con discapacidad, condiciones de salud o situaciones de diversidad.",
    forYou: [
      "Necesitas un ajuste razonable para tus clases o evaluaciones.",
      "Tienes una condición de salud que afecta tu vida académica.",
      "Buscas un espacio seguro para hablar de diversidad e inclusión.",
      "Quieres conocer tus derechos y las rutas de atención."
    ],
    steps: [
      "Solicita una reunión confidencial.",
      "Revisamos juntos tu situación y los apoyos disponibles.",
      "Definimos un plan de acompañamiento con tu facultad."
    ],
    duration: "40 min",
    modality: "Virtual o presencial",
    requires: "Cita previa",
    schedule: "Lunes a viernes, 8:00 a. m. – 4:00 p. m.",
    place: "Bloque de Bienestar, piso 1 · Sede Cúcuta",
    contact: "inclusion@unisimon.edu.co",
    tags: ["Gratuito", "Confidencial", "Ajustes razonables"],
    cta: "Solicitar acompañamiento",
    note: "La conversación es confidencial y no requiere un diagnóstico previo para empezar.",
    keywords: "inclusion discapacidad diversidad ajuste barrera salud condicion derechos genero"
  },
  {
    id: "cultura",
    name: "Cultura, deporte y recreación",
    category: "Cultura",
    icon: "users",
    tone: "lime",
    short: "Deporte, arte y comunidad para cuidar tu bienestar integral.",
    description: "Grupos representativos, talleres, torneos y actividades recreativas para desconectarte de la rutina, conocer personas y cuidar tu salud física y mental desde otra orilla.",
    forYou: [
      "Quieres conocer personas y sentirte parte de la U.",
      "Necesitas una pausa activa entre clases.",
      "Te interesa el deporte, la música, el teatro o la danza.",
      "Buscas actividades gratuitas para tu tiempo libre."
    ],
    steps: [
      "Consulta la agenda semanal de actividades.",
      "Inscríbete en la actividad que te interese.",
      "Participa y conoce los grupos representativos."
    ],
    duration: "Según actividad",
    modality: "Presencial",
    requires: "Inscripción",
    schedule: "Consulta la agenda semanal en la app",
    place: "Zonas deportivas y culturales · Sede Cúcuta",
    contact: "bienestar.cultura@unisimon.edu.co",
    tags: ["Gratuito", "Presencial", "Comunidad"],
    cta: "Conocer horarios",
    note: "La mayoría de las actividades no requiere experiencia previa, solo ganas de participar.",
    keywords: "deporte cultura arte musica teatro danza recreacion grupo torneo actividad tiempo libre"
  },
  {
    id: "salud",
    name: "Salud y prevención",
    category: "Salud",
    icon: "shield",
    tone: "sky",
    short: "Orientación en salud física, prevención y hábitos saludables.",
    description: "Atención básica, orientación en salud sexual y reproductiva, prevención de riesgos y acompañamiento en hábitos saludables para que tu bienestar físico también tenga un lugar en la U.",
    forYou: [
      "Tienes una molestia física o una duda de salud.",
      "Necesitas orientación sobre salud sexual y reproductiva.",
      "Quieres mejorar tus hábitos de sueño o alimentación.",
      "Buscas información confiable sobre prevención."
    ],
    steps: [
      "Agenda tu orientación.",
      "Cuéntanos qué necesitas revisar o prevenir.",
      "Recibe orientación y, si hace falta, una remisión."
    ],
    duration: "30 min",
    modality: "Presencial",
    requires: "Cita previa",
    schedule: "Lunes a viernes, 7:00 a. m. – 4:00 p. m.",
    place: "Enfermería, bloque A · Sede Cúcuta",
    contact: "salud@unisimon.edu.co",
    tags: ["Gratuito", "Presencial", "Confidencial"],
    cta: "Agendar cita",
    note: "Este servicio orienta y previene. No reemplaza una consulta médica de urgencia.",
    keywords: "salud enfermeria medico prevencion alimentacion sueno sexual habitos cuerpo"
  }
];
