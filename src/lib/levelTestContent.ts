export interface DialogueLine {
  speaker: "A" | "B" | "System"; // 'System' para narrador o texto sin hablante
  text: string;
}

export interface TestQuestion {
  id: number;
  context?: string; // Ej: "(En la cocina)"
  dialogue: DialogueLine[];
  options: string[];
  correctAnswer: string;
}

export const LEVEL_TEST_DATA = {
  title: "Prueba de Nivel – Instituto Cervantes",
  description:
    "Esta prueba evalúa tu competencia comunicativa. Lee atentamente el contexto y selecciona la opción más adecuada.",
  questions: [
    // --- NIVEL A1-A2 (Básico) ---
    {
      id: 1,
      dialogue: [{ speaker: "A" as const, text: "¿___ eres?" }],
      options: ["Dónde", "De dónde", "A dónde", "En dónde"],
      correctAnswer: "De dónde",
    },
    {
      id: 2,
      dialogue: [
        {
          speaker: "A" as const,
          text: "Está lloviendo bastante, ¿no?",
        },
        {
          speaker: "B" as const,
          text: "Sí, pero no ___ frío.",
        },
      ],
      options: ["es", "está", "hace", "hay"],
      correctAnswer: "hace",
    },
    {
      id: 3,
      context: "(Dos compañeros de trabajo hablando)",
      dialogue: [
        {
          speaker: "A" as const,
          text: "Y tú, ¿qué haces los fines de semana?",
        },
        {
          speaker: "B" as const,
          text: "Pues ___ mucho salir con amigos, ir al cine.",
        },
      ],
      options: [
        "me gusto",
        "a mí gusta",
        "me gusta",
        "me gustan",
      ],
      correctAnswer: "me gusta",
    },
    {
      id: 4,
      context: "(En la cocina)",
      dialogue: [
        {
          speaker: "A" as const,
          text: "¿Qué hacemos de comer?",
        },
        {
          speaker: "B" as const,
          text: "___ pizza en el congelador.",
        },
      ],
      options: ["Está una", "Hay una", "Es la", "Allí es"],
      correctAnswer: "Hay una",
    },
    {
      id: 5,
      context: "(Dos amigos hablando)",
      dialogue: [
        {
          speaker: "A" as const,
          text: "No __ nada tener que limpiar los cristales.",
        },
        { speaker: "B" as const, text: "__." },
      ],
      options: [
        "te gusta / Yo sí",
        "me gusto / A mí también",
        "me gusta / A mí tampoco",
        "gusto / Yo no",
      ],
      correctAnswer: "me gusta / A mí tampoco",
    },
    {
      id: 6,
      context: "(Al llegar a casa)",
      dialogue: [
        { speaker: "A" as const, text: "¿Ha llamado alguien?" },
        {
          speaker: "B" as const,
          text: "No, no ha llamado ___.",
        },
      ],
      options: ["alguien", "nada", "ninguno", "nadie"],
      correctAnswer: "nadie",
    },
    {
      id: 7,
      dialogue: [
        {
          speaker: "A" as const,
          text: "¿Puedo abrir la ventana? Es que tengo ___ calor.",
        },
        {
          speaker: "B" as const,
          text: "Sí, claro. Ábrela, ábrela.",
        },
      ],
      options: ["muy", "suficiente", "mucho", "tan"],
      correctAnswer: "mucho",
    },
    {
      id: 8,
      context: "(En una tienda de ropa)",
      dialogue: [
        {
          speaker: "A" as const,
          text: "Quería unos pantalones de verano.",
        },
        { speaker: "B" as const, text: "¿Cómo ___ quiere?" },
      ],
      options: ["les", "unos", "los", "ellos"],
      correctAnswer: "los",
    },
    {
      id: 9,
      dialogue: [
        {
          speaker: "A" as const,
          text: "¿A qué hora abren los bancos en España?",
        },
        { speaker: "B" as const, text: "___" },
      ],
      options: ["8", "Son las", "A las 8", "Las 8"],
      correctAnswer: "A las 8",
    },
    {
      id: 10,
      dialogue: [
        {
          speaker: "A" as const,
          text: "Normalmente __ sobre las doce todos los días.",
        },
      ],
      options: [
        "nos acuestamos",
        "nos acostamos",
        "se acostan",
        "acostarse",
      ],
      correctAnswer: "nos acostamos",
    },
    {
      id: 11,
      dialogue: [
        {
          speaker: "A" as const,
          text: "Mis zapatos no son __ caros __ los tuyos.",
        },
      ],
      options: [
        "más / como",
        "tan / como",
        "tan / que",
        "los / de",
      ],
      correctAnswer: "tan / como",
    },
    {
      id: 12,
      context: "(Por teléfono)",
      dialogue: [
        { speaker: "A" as const, text: "Oiga, ¿está Pedro?" },
        {
          speaker: "B" as const,
          text: "No, __ en casa de un amigo.",
        },
      ],
      options: [
        "estudiado",
        "es estudiando",
        "está estudiando",
        "estudiando",
      ],
      correctAnswer: "está estudiando",
    },
    {
      id: 13,
      dialogue: [
        {
          speaker: "A" as const,
          text: "Odio tener que __ temprano los fines de semana.",
        },
      ],
      options: [
        "se levantar",
        "me levanto",
        "levantarme",
        "el desayuno",
      ],
      correctAnswer: "levantarme",
    },
    {
      id: 14,
      dialogue: [
        {
          speaker: "A" as const,
          text: "¿__ alguna vez en Panamá?",
        },
        { speaker: "B" as const, text: "No, nunca." },
      ],
      options: ["Has estado", "Estabas", "Has ido", "Fuiste"],
      correctAnswer: "Has estado",
    },
    {
      id: 15,
      dialogue: [
        {
          speaker: "A" as const,
          text: "Oiga, perdone ¿cómo se llega al metro más cercano?",
        },
        {
          speaker: "B" as const,
          text: "__ hasta el semáforo y allí __ a la derecha.",
        },
      ],
      options: [
        "Id / girad",
        "Vaya / gire",
        "Venga / Voltee",
        "Ve / gire",
      ],
      correctAnswer: "Vaya / gire",
    },
    {
      id: 16,
      context: "(En una agencia de viajes)",
      dialogue: [
        { speaker: "A" as const, text: "¿Conoce Atenas?" },
        { speaker: "B" as const, text: "No, __" },
      ],
      options: [
        "no he estado nunca",
        "no estuve alguna vez",
        "no he estado alguna vez",
        "no estaba nunca",
      ],
      correctAnswer: "no he estado nunca",
    },
    {
      id: 17,
      context: "(Haciendo planes)",
      dialogue: [
        {
          speaker: "A" as const,
          text: "¿Cuándo vas a ir a esquiar?",
        },
        {
          speaker: "B" as const,
          text: "Pues la semana __.",
        },
      ],
      options: ["seguida", "que viene", "próximo", "futura"],
      correctAnswer: "que viene",
    },
    {
      id: 18,
      context: "(Dos amigos hablan del fin de semana)",
      dialogue: [
        {
          speaker: "A" as const,
          text: "El viernes por la noche __ en Nixon's con María.",
        },
        { speaker: "B" as const, text: "¡Qué suerte!" },
      ],
      options: ["estuve", "he estado", "fui", "he ido"],
      correctAnswer: "estuve",
    },
    {
      id: 19,
      dialogue: [
        {
          speaker: "A" as const,
          text: "¿Has ido a ver a Rosa?",
        },
        {
          speaker: "B" as const,
          text: "No, __ no he ido a verla, no he tenido tiempo.",
        },
      ],
      options: ["ya", "entonces", "ahora", "todavía"],
      correctAnswer: "todavía",
    },
    {
      id: 20,
      dialogue: [
        {
          speaker: "A" as const,
          text: "Oye, Helen, ¿por qué estudias español?",
        },
        {
          speaker: "B" as const,
          text: "Pues porque lo necesito __ trabajar en Latinoamérica.",
        },
      ],
      options: ["por", "a", "para", "en"],
      correctAnswer: "para",
    },
    {
      id: 21,
      dialogue: [
        {
          speaker: "A" as const,
          text: "¿__ te gusta más? ¿El día o la noche?",
        },
        { speaker: "B" as const, text: "El día" },
      ],
      options: ["Quién", "Cuál", "Qué", "A cuál"],
      correctAnswer: "Qué",
    },
    {
      id: 22,
      dialogue: [
        {
          speaker: "A" as const,
          text: 'Antes no __ nada, pero desde que tomo "Sleepmador" __ estupendamente.',
        },
      ],
      options: [
        "dormí / duermo",
        "he dormido / he dormido",
        "dormía / duermo",
        "duermo / dormí",
      ],
      correctAnswer: "dormía / duermo",
    },
    {
      id: 23,
      dialogue: [
        {
          speaker: "A" as const,
          text: "Cuando __ a Marta, __ en la ONU, pero ahora no sé qué hace.",
        },
      ],
      options: [
        "conocí / trabajaba",
        "conozca / trabaja",
        "conocía / trabajó",
        "supe / laboró",
      ],
      correctAnswer: "conocí / trabajaba",
    },
    {
      id: 24,
      context: "(En una entrevista de trabajo)",
      dialogue: [
        {
          speaker: "A" as const,
          text: "¿Y habla usted idiomas?",
        },
        {
          speaker: "B" as const,
          text: "Sí, hablo muy bien francés y estudio inglés __ seis años.",
        },
      ],
      options: [
        "desde hace",
        "desde",
        "desde que",
        "al cabo de",
      ],
      correctAnswer: "desde hace",
    },
    {
      id: 25,
      dialogue: [
        {
          speaker: "A" as const,
          text: "Empecé a montar a caballo cuando tenía 10 años y __ seis meses gané mi primer premio en un concurso.",
        },
      ],
      options: ["después", "dentro", "desde", "al cabo de"],
      correctAnswer: "al cabo de",
    },
    {
      id: 26,
      context: "(Un padre enfadado a su hija)",
      dialogue: [
        {
          speaker: "A" as const,
          text: "¡Mira cómo tienes las manos, __!",
        },
      ],
      options: ["lávalas", "lávatelas", "lávelas", "láveselas"],
      correctAnswer: "lávatelas",
    },
    {
      id: 27,
      context: "(Una invitación)",
      dialogue: [
        {
          speaker: "A" as const,
          text: "¿Por qué no te vienes mañana a esquiar?",
        },
        {
          speaker: "B" as const,
          text: "Me __, pero no __ esquiar.",
        },
      ],
      options: [
        "gustaba / puedo",
        "gusta / conozco",
        "gustará / sé",
        "gustaría / sé",
      ],
      correctAnswer: "gustaría / sé",
    },
    {
      id: 28,
      context: "(Dos amigas hablando)",
      dialogue: [
        {
          speaker: "A" as const,
          text: "¿Sabes que me empieza a gustar Javier? Pero, por favor Tere, no __ a nadie.",
        },
        {
          speaker: "B" as const,
          text: "No te preocupes, soy una tumba.",
        },
      ],
      options: [
        "se lo cuentes",
        "le cuentas",
        "se le cuentes",
        "le cuentes",
      ],
      correctAnswer: "se lo cuentes",
    },
    {
      id: 29,
      context: "(Una madre a sus hijos)",
      dialogue: [
        {
          speaker: "A" as const,
          text: "Niños, __ los dientes antes de iros a la cama, por favor.",
        },
      ],
      options: ["lavad", "os lavéis", "lavados", "lavaos"],
      correctAnswer: "lavaos",
    },
    {
      id: 30,
      dialogue: [
        {
          speaker: "A" as const,
          text: "¿Le has dicho a Paco que mañana hacemos una fiesta?",
        },
        {
          speaker: "B" as const,
          text: "Sí, ya __ he dicho.",
        },
      ],
      options: ["le lo", "le", "se lo", "se le"],
      correctAnswer: "se lo",
    },

    // --- NIVEL B1-B2 (Intermedio) ---
    {
      id: 31,
      dialogue: [
        {
          speaker: "A" as const,
          text: "__ me han dado la beca para estudiar en España, voy a tener que dejar el trabajo.",
        },
      ],
      options: ["Sin embargo", "Por que", "Entonces", "Como"],
      correctAnswer: "Como",
    },
    {
      id: 32,
      dialogue: [
        {
          speaker: "A" as const,
          text: "Estamos buscando una secretaria que __ español e inglés.",
        },
      ],
      options: ["hablando", "hable", "habla", "hablado"],
      correctAnswer: "hable",
    },
    {
      id: 33,
      context: "(Preparando una fiesta)",
      dialogue: [
        { speaker: "A" as const, text: "¿Compramos más vino?" },
        {
          speaker: "B" as const,
          text: "No creo que __ necesario.",
        },
      ],
      options: ["esté", "está", "es", "sea"],
      correctAnswer: "sea",
    },
    {
      id: 34,
      context: "(En el horóscopo de una revista)",
      dialogue: [
        {
          speaker: "System" as const,
          text: "Aries. Tendrá una semana muy ocupada, pero es posible que __ una persona muy interesante en su trabajo.",
        },
      ],
      options: ["sepa", "conozca", "supo", "conocerá"],
      correctAnswer: "conozca",
    },
    {
      id: 35,
      context: "(Una pareja en casa)",
      dialogue: [
        {
          speaker: "A" as const,
          text: "¿Cuándo te __ unos días de descanso?",
        },
        {
          speaker: "B" as const,
          text: "Uy, no sé... cuando __. Ahora tengo mucho trabajo.",
        },
      ],
      options: [
        "tomes / pueda",
        "tomarás / pueda",
        "tomarás / podré",
        "tomes / puedo",
      ],
      correctAnswer: "tomarás / pueda",
    },
    {
      id: 36,
      dialogue: [
        {
          speaker: "A" as const,
          text: "Es normal que __ una prueba de nivel antes de matricularnos en las clases de español.",
        },
      ],
      options: ["hagamos", "hacer", "hacemos", "tendremos"],
      correctAnswer: "hagamos",
    },
    {
      id: 37,
      context: "(En una estación de autobuses)",
      dialogue: [
        {
          speaker: "A" as const,
          text: "¿__ decirme __ ha llegado el de Madrid?",
        },
      ],
      options: [
        "Debes / si que",
        "Podría / si",
        "Querría / si que",
        "Sabes / que",
      ],
      correctAnswer: "Podría / si",
    },
    {
      id: 38,
      context: "(Dos amigos hablando)",
      dialogue: [
        {
          speaker: "A" as const,
          text: "En mi ordenador nuevo se pueden ver películas en DVD.",
        },
        {
          speaker: "B" as const,
          text: "¿Ah sí?, pues en __ no.",
        },
      ],
      options: ["mi", "yo", "el mío", "mío"],
      correctAnswer: "el mío",
    },
    {
      id: 39,
      context: "(En el coche)",
      dialogue: [
        {
          speaker: "A" as const,
          text: "¿Quieres que __ yo un rato?",
        },
        {
          speaker: "B" as const,
          text: "No, deja, no estoy cansado.",
        },
      ],
      options: ["conducía", "conduzco", "conducir", "conduzca"],
      correctAnswer: "conduzca",
    },
    {
      id: 40,
      dialogue: [
        {
          speaker: "A" as const,
          text: "Me pone de muy mal humor que __ cuando estoy durmiendo la siesta.",
        },
      ],
      options: [
        "me despiertan",
        "me despierten",
        "ser despertado",
        "despertarme",
      ],
      correctAnswer: "me despierten",
    },
    {
      id: 41,
      context: "(Haciendo planes para el fin de semana)",
      dialogue: [
        {
          speaker: "A" as const,
          text: "Si __ el domingo, no __ a la playa.",
        },
      ],
      options: [
        "lloverá / iremos",
        "llueva / iríamos",
        "llueve / vamos",
        "llovería / fuéramos",
      ],
      correctAnswer: "llueve / vamos",
    },
    {
      id: 42,
      context: "(Dos personas en la calle)",
      dialogue: [
        { speaker: "A" as const, text: "¿Tiene hora?" },
        {
          speaker: "B" as const,
          text: "No, pero __ las tres o tres y diez.",
        },
      ],
      options: ["serán", "serían", "sean", "fueran"],
      correctAnswer: "serán",
    },
    {
      id: 43,
      context: "(Una madre a su hijo que no quiere comer)",
      dialogue: [
        {
          speaker: "A" as const,
          text: "__ te __ la sopa, no te doy el helado.",
        },
      ],
      options: [
        "Hasta cuando / acabes",
        "Hasta que no / acabes",
        "Hasta que / acabas",
        "Cuando / acabas",
      ],
      correctAnswer: "Hasta que no / acabes",
    },
    {
      id: 44,
      dialogue: [
        {
          speaker: "A" as const,
          text: "A Raquel no hay quien la entienda. Habíamos hablado de hacer algo el domingo y al final no me llamó ni nada.",
        },
        {
          speaker: "B" as const,
          text: "Bueno, puede ser que __. Es un poco despistada.",
        },
      ],
      options: [
        "se olvidaría",
        "se olvidara",
        "se olvidaba",
        "se olvidó",
      ],
      correctAnswer: "se olvidara",
    },
    {
      id: 45,
      context: "(Un comentario personal)",
      dialogue: [
        {
          speaker: "A" as const,
          text: "Me __ colorado al hablar en público.",
        },
      ],
      options: ["parezco", "hago", "vuelvo", "pongo"],
      correctAnswer: "pongo",
    },
    {
      id: 46,
      context: "(Un médico recetando)",
      dialogue: [
        {
          speaker: "A" as const,
          text: "Cuando __, tómese estas pastillas.",
        },
      ],
      options: [
        "se levante",
        "se levantará",
        "se levantara",
        "se levantaría",
      ],
      correctAnswer: "se levante",
    },
    {
      id: 47,
      dialogue: [
        {
          speaker: "A" as const,
          text: "El otro día estaba preparando una presentación y cuando ya __ más de tres horas escribiendo se me apagó el ordenador. Entonces me di cuenta de que no había grabado el documento, me dio un ataque de histeria y __ a gritar.",
        },
      ],
      options: [
        "estaba / me puse",
        "estaba / dejé de",
        "llevaba / dejé de",
        "llevaba / me puse a",
      ],
      correctAnswer: "llevaba / me puse a",
    },
    {
      id: 48,
      context: "(En una ferretería)",
      dialogue: [
        {
          speaker: "A" as const,
          text: "Perdone, ¿tiene algo __ cerrar esta caja?",
        },
      ],
      options: [
        "puedo con que",
        "pueda con el",
        "con lo que pueda",
        "con el que puedo",
      ],
      correctAnswer: "con lo que pueda",
    },
    {
      id: 49,
      context: "(Pensando en las próximas vacaciones)",
      dialogue: [
        {
          speaker: "A" as const,
          text: "¿Sabes que queremos ir a Roma en Semana Santa?",
        },
        {
          speaker: "B" as const,
          text: "Pues os recomendaría que __ el billete ya.",
        },
      ],
      options: [
        "reservad",
        "reservéis",
        "reservarais",
        "reserven",
      ],
      correctAnswer: "reservéis",
    },
    {
      id: 50,
      dialogue: [
        {
          speaker: "A" as const,
          text: "No sé qué pasa, pero Juan siempre se mete en líos.",
        },
        {
          speaker: "B" as const,
          text: "¿Te han contado lo último?",
        },
        {
          speaker: "System" as const,
          text: '¿Qué significa "se mete en líos"? __',
        },
      ],
      options: [
        "Se carga de trabajo",
        "Se enamora de todos",
        "Entra en situaciones complicadas",
        "Siempre llega tarde al trabajo",
      ],
      correctAnswer: "Entra en situaciones complicadas",
    },

    // --- NIVEL B2-C1 (Intermedio-Alto / Avanzado) ---
    {
      id: 51,
      context: "(En la oficina a las once de la mañana)",
      dialogue: [
        {
          speaker: "A" as const,
          text: "A las once siempre me da un hambre terrible.",
        },
        {
          speaker: "B" as const,
          text: "Si te __ antes, te __ tiempo de desayunar.",
        },
      ],
      options: [
        "levantes / daría",
        "habrías levantado / daría",
        "levantaras / daría",
        "levantas / hubiera dado",
      ],
      correctAnswer: "levantaras / daría",
    },
    {
      id: 52,
      context:
        "(Una pareja discutiendo porque uno no quiere ir a la fiesta)",
      dialogue: [
        {
          speaker: "A" as const,
          text: "¡Venga, no te pongas así!",
        },
        {
          speaker: "B" as const,
          text: "¡Ya te he dicho que no quiero ir!",
        },
        {
          speaker: "A" as const,
          text: "¡Venga, nos lo vamos a pasar muy bien!",
        },
        { speaker: "B" as const, text: "__ no pienso ir." },
      ],
      options: [
        "Aunque insistirías",
        "A pesar que insistir",
        "Por mucho que insistas",
        "Con tal de insistir",
      ],
      correctAnswer: "Por mucho que insistas",
    },
    {
      id: 53,
      dialogue: [
        {
          speaker: "A" as const,
          text: "Mira, que esta tarde no voy a ir a tu casa.",
        },
        { speaker: "B" as const, text: "__" },
      ],
      options: [
        "¿Por supuesto?",
        "¿Es que?",
        "Faltaría más",
        "¿Y eso?",
      ],
      correctAnswer: "¿Y eso?",
    },
    {
      id: 54,
      context: "(Una noticia en el periódico)",
      dialogue: [
        {
          speaker: "System" as const,
          text: '"El ministro __ que __ a dimitir"',
        },
      ],
      options: [
        "rechaza / poder",
        "niega / vaya",
        "prometiera / iría",
        "insiste / fuera",
      ],
      correctAnswer: "niega / vaya",
    },
    {
      id: 55,
      dialogue: [
        {
          speaker: "A" as const,
          text: "Nunca en mi vida __ tanto como este mes. El viernes ya no podía más, me metí en la cama y __ toda la tarde.",
        },
      ],
      options: [
        "he trabajado / estaba durmiendo",
        "he trabajado / estuve durmiendo",
        "trabajo / estaba durmiendo",
        "trabajo / estuve durmiendo",
      ],
      correctAnswer: "he trabajado / estuve durmiendo",
    },
    {
      id: 56,
      dialogue: [
        {
          speaker: "A" as const,
          text: "¿Has leído el periódico de hoy? Dice que unos científicos han inventado algo __ podrían hacerse ricos rápidamente. Se trata de una máquina que sirve para que podamos descansar sin tener que dormir.",
        },
      ],
      options: [
        "con lo que",
        "con la que",
        "por la que",
        "por el que",
      ],
      correctAnswer: "con lo que",
    },
    {
      id: 57,
      dialogue: [
        {
          speaker: "A" as const,
          text: "¡Qué raro que Arturo y su mujer se hayan separado! ¡Con lo que se querían!",
        },
        {
          speaker: "B" as const,
          text: "¿Quererse? ¡Qué va! No sólo no se querían __ se llevaban fatal.",
        },
      ],
      options: ["sino", "pero que", "sino que", "pero"],
      correctAnswer: "sino que",
    },
    {
      id: 58,
      dialogue: [
        {
          speaker: "A" as const,
          text: "¿Qué pasó el otro día?",
        },
        {
          speaker: "B" as const,
          text: "Pues nada, que Laura llevaba un reloj nuevo precioso. Rafael le preguntó si le __ mucho y ella le contestó que no. Así que le pidió que le __ uno igual.",
        },
      ],
      options: [
        "había costado / compraría",
        "costaría / comprara",
        "costaría / compraría",
        "había costado / comprara",
      ],
      correctAnswer: "había costado / comprara",
    },
    {
      id: 59,
      dialogue: [
        {
          speaker: "A" as const,
          text: "Hija mía, ten cuidado con el sol. Ponte un poco de crema antes __ demasiado tarde.",
        },
        {
          speaker: "B" as const,
          text: "No necesito crema. Además, pienso quedarme en el jardín hasta que __ de noche.",
        },
      ],
      options: [
        "de que sea  / se hará",
        "de ser / se haga",
        "de ser / se hará",
        "de que sea / se haga",
      ],
      correctAnswer: "de que sea / se haga",
    },
    {
      id: 60,
      dialogue: [
        {
          speaker: "A" as const,
          text: "¿Tú crees que va a llover?",
        },
        {
          speaker: "B" as const,
          text: "En Londres nunca se sabe. Yo llevaría un paraguas por si las moscas.",
        },
        {
          speaker: "System" as const,
          text: '¿Qué significa "por si las moscas"? __',
        },
      ],
      options: [
        "para la lluvia",
        "para espantar las moscas",
        "por si acaso",
        "vale la pena",
      ],
      correctAnswer: "por si acaso",
    },
    {
      id: 61,
      dialogue: [
        {
          speaker: "System" as const,
          text: "Últimamente Álvaro siempre está a dos velas, y eso que no para de trabajar.",
        },
        {
          speaker: "System" as const,
          text: '¿Qué significa "está a dos velas"? __',
        },
      ],
      options: [
        "sin dinero",
        "muy cansado",
        "muy deprimido",
        "harto",
      ],
      correctAnswer: "sin dinero",
    },
    {
      id: 62,
      dialogue: [
        {
          speaker: "A" as const,
          text: "Por poco que __ conseguirás aprobar.",
        },
      ],
      options: [
        "estudies",
        "estudias",
        "estudiarías",
        "has estudiado",
      ],
      correctAnswer: "estudies",
    },
    {
      id: 63,
      dialogue: [
        {
          speaker: "A" as const,
          text: "__ al retraso de las ayudas económicas, mereció la pena el proyecto.",
        },
      ],
      options: ["Si bien", "A pesar de", "Aun", "Pese"],
      correctAnswer: "Pese",
    },
    {
      id: 64,
      dialogue: [
        {
          speaker: "A" as const,
          text: "¿Por cuánto te han salido las gafas?",
        },
        {
          speaker: "B" as const,
          text: "__ veinte mil, con el carnet de estudiante.",
        },
      ],
      options: [
        "Vienen a salir por unas",
        "Devienen saliendo unas",
        "Acusan de salir unas",
        "Llegan saliendo unas",
      ],
      correctAnswer: "Vienen a salir por unas",
    },
    {
      id: 65,
      dialogue: [
        {
          speaker: "A" as const,
          text: "De repente __ una idea para solucionar el problema de las tuberías.",
        },
      ],
      options: [
        "ocurrió",
        "se ocurrió",
        "me ocurrió",
        "se me ocurrió",
      ],
      correctAnswer: "se me ocurrió",
    },
    {
      id: 66,
      dialogue: [
        {
          speaker: "System" as const,
          text: "Me sacan de quicio las puertas giratorias.",
        },
        {
          speaker: "System" as const,
          text: '¿Qué significa "Me sacan de quicio"? __',
        },
      ],
      options: [
        "Me encantan",
        "No soporto",
        "Me revuelven",
        "Me asustan",
      ],
      correctAnswer: "No soporto",
    },
    {
      id: 67,
      dialogue: [
        {
          speaker: "A" as const,
          text: "¿Sabes que a Pepe no le han dado la beca?",
        },
        {
          speaker: "B" as const,
          text: "¡Vaya por Dios! ¡__!",
        },
      ],
      options: [
        "Con la falta que le hacía",
        "Estuvo desgraciado",
        "Fue decepcionante",
        "Tendido supino",
      ],
      correctAnswer: "Con la falta que le hacía",
    },
    {
      id: 68,
      context:
        "(Una madre amenaza a su hijo que no quiere comer)",
      dialogue: [
        {
          speaker: "A" as const,
          text: "¿__ quieres tomarte la leche? Pues no hay postre.",
        },
      ],
      options: [
        "Inclusive no",
        "A pesar así nunca",
        "Por supuesto de que no",
        "Conque no",
      ],
      correctAnswer: "Conque no",
    },

    // --- NIVEL C1-C2 (Avanzado) ---
    {
      id: 69,
      dialogue: [
        {
          speaker: "A" as const,
          text: "¿Te gusta entonces el armario?",
        },
        {
          speaker: "B" as const,
          text: "Sí, pero yo le cambiaría los __.",
        },
      ],
      options: ["pesos", "alfileres", "tiradores", "ojales"],
      correctAnswer: "tiradores",
    },
    {
      id: 70,
      context: "(Dos hermanas peleándose)",
      dialogue: [
        {
          speaker: "A" as const,
          text: "Seguro que me has cogido tú la falda y me la has manchado.",
        },
        {
          speaker: "B" as const,
          text: "¡__ mentirosa! La falda la manchaste tú.",
        },
      ],
      options: ["Serás", "Eres", "Fuiste", "Serías"],
      correctAnswer: "Serás",
    },
    {
      id: 71,
      dialogue: [
        {
          speaker: "System" as const,
          text: '"El museo del Prado __ una de las colecciones de cuadros más importantes del mundo"',
        },
      ],
      options: [
        "adopta",
        "consulta",
        "cuenta con",
        "refiere a",
      ],
      correctAnswer: "cuenta con",
    },
    {
      id: 72,
      dialogue: [
        {
          speaker: "A" as const,
          text: "¡Qué pequeña se te ha quedado la chaqueta!",
        },
        {
          speaker: "B" as const,
          text: "Ya… es que __ por lavarla con agua caliente.",
        },
      ],
      options: [
        "ha empequeñecido",
        "ha reducido",
        "ha disminuido",
        "ha encogido",
      ],
      correctAnswer: "ha encogido",
    },
    {
      id: 73,
      context: "(Dos estudiantes comparando lenguas)",
      dialogue: [
        {
          speaker: "A" as const,
          text: "Pues el español es mucho más útil que el alemán.",
        },
        {
          speaker: "B" as const,
          text: "¡Hombre, claro, __!",
        },
      ],
      options: [
        "dónde va a parar",
        "vete tú a saber",
        "quién lo diría",
        "ande yo caliente",
      ],
      correctAnswer: "dónde va a parar",
    },
    {
      id: 74,
      dialogue: [
        {
          speaker: "System" as const,
          text: '"El hecho de que no __ agua en las zonas áridas del desierto, no __ la presencia humana."',
        },
      ],
      options: [
        "haya / impide",
        "haya / impida",
        "hay / impida",
        "hay / impide",
      ],
      correctAnswer: "haya / impide",
    },
    {
      id: 75,
      dialogue: [
        {
          speaker: "System" as const,
          text: '"Este modelo de vídeo graba automáticamente. __ su calidad de imagen y sonido es insuperable."',
        },
      ],
      options: [
        "En sentido opuesto que",
        "Ni que decir tiene que",
        "Sin necesidad de que",
        "Permitiendo que",
      ],
      correctAnswer: "Ni que decir tiene que",
    },
  ],
  writingTask: {
    title: "✉️ Carta final (Redacción)",
    context: `Lee atentamente la carta que acabas de recibir de una española. Después redacta una respuesta:

"Hola, ¿qué tal?

Me llamo Fuencisla. Soy una muchacha castellana de 20 años, a la que le gustaría contactar con estudiantes de español. Vivo con mis padres y tres hermanas en un pequeño pueblo de Segovia. La vida aquí es bastante aburrida: hay más ovejas que habitantes. Por eso me gustaría conocer otros sitios, qué hace la gente en ciudades como Londres.

A mí me interesa sobre todo la música moderna: toco la guitarra en un grupo de música "heavy", y he dejado de estudiar para dedicarme a la vida artística. Me encantaría que me contaras cómo es tu ciudad y cuál es la mejor época para visitarla.

Si te interesa hacer nuevos amigos, ¿por qué no me escribes y me hablas un poco de ti: cómo eres, qué haces, qué te gusta …?

Hasta pronto,
Fuencisla"`,
    prompt:
      "Escribe una respuesta a Fuencisla hablándole de ti, tu ciudad, tus gustos y respondiendo a sus preguntas. (Mínimo 80 palabras)",
    minWords: 80,
  },
};