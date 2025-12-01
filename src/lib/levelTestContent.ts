export interface DialogueLine {
  speaker: 'A' | 'B' | 'System'; // 'System' para narrador o texto sin hablante
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
  title: "Prueba de Nivel Oficial",
  description: "Esta prueba evalúa tu competencia comunicativa. Lee atentamente el contexto y selecciona la opción más adecuada.",
  questions: [
    // --- NIVEL A1-A2 (Básico) ---
    { 
      id: 1, 
      dialogue: [{ speaker: 'A', text: "¿___ eres?" }], 
      options: ["Dónde", "De dónde", "A dónde", "En dónde"], 
      correctAnswer: "De dónde" 
    },
    { 
      id: 2, 
      dialogue: [
        { speaker: 'A', text: "Está lloviendo bastante, ¿no?" },
        { speaker: 'B', text: "Sí, pero no ___ frío." }
      ], 
      options: ["es", "está", "hace", "hay"], 
      correctAnswer: "hace" 
    },
    { 
      id: 3, 
      context: "(Dos compañeros de trabajo hablando)",
      dialogue: [
        { speaker: 'A', text: "Y tú, ¿qué haces los fines de semana?" },
        { speaker: 'B', text: "Pues... a mí no ___ nada tener que limpiar los cristales." }
      ], 
      options: ["me gusto", "a mí gusta", "me gusta", "me gustan"], 
      correctAnswer: "me gusta" 
    },
    { 
      id: 4, 
      context: "(En la cocina)",
      dialogue: [
        { speaker: 'A', text: "¿Qué hacemos de comer?" },
        { speaker: 'B', text: "___ pizza en el congelador." }
      ], 
      options: ["Está una", "Hay una", "Es la", "Allí es"], 
      correctAnswer: "Hay una" 
    },
    { 
      id: 5, 
      context: "(Al llegar a casa)",
      dialogue: [
        { speaker: 'A', text: "¿Ha llamado alguien?" },
        { speaker: 'B', text: "No, no ha llamado ___." }
      ], 
      options: ["alguien", "nada", "nadie", "ninguno"], 
      correctAnswer: "nadie" 
    },
    { 
      id: 6, 
      dialogue: [{ speaker: 'A', text: "Mis zapatos no son ___ caros ___ los tuyos." }], 
      options: ["más / como", "tan / como", "tan / que", "los / de"], 
      correctAnswer: "tan / como" 
    },
    { 
      id: 7, 
      dialogue: [{ speaker: 'A', text: "Odio tener que ___ temprano los fines de semana." }], 
      options: ["se levantar", "me levanto", "levantarme", "el desayuno"], 
      correctAnswer: "levantarme" 
    },
    { 
      id: 8, 
      dialogue: [
        { speaker: 'A', text: "¿___ alguna vez en Panamá?" },
        { speaker: 'B', text: "No, nunca." }
      ], 
      options: ["Has estado", "Estabas", "Has ido", "Fuiste"], 
      correctAnswer: "Has estado" 
    },
    { 
      id: 9, 
      dialogue: [
        { speaker: 'A', text: "Perdone, ¿cómo se llega al metro?" },
        { speaker: 'B', text: "___ hasta el semáforo y gire a la derecha." }
      ], 
      options: ["Id", "Vaya", "Venga", "Ve"], 
      correctAnswer: "Vaya" 
    },
    { 
      id: 10, 
      context: "(Haciendo planes)",
      dialogue: [
        { speaker: 'A', text: "¿Cuándo vas a ir a esquiar?" },
        { speaker: 'B', text: "Pues la semana ___." }
      ], 
      options: ["seguida", "que viene", "próximo", "futura"], 
      correctAnswer: "que viene" 
    },
    { 
      id: 11, 
      context: "(Dos amigos hablan del fin de semana)",
      dialogue: [
        { speaker: 'A', text: "El viernes por la noche ___ en Nixon's con María." },
        { speaker: 'B', text: "¡Qué suerte!" }
      ], 
      options: ["estuve", "he estado", "fui", "he ido"], 
      correctAnswer: "estuve" 
    },
    { 
      id: 12, 
      dialogue: [
        { speaker: 'A', text: "¿Has ido a ver a Rosa?" },
        { speaker: 'B', text: "No, ___ no he ido a verla, no he tenido tiempo." }
      ], 
      options: ["ya", "entonces", "ahora", "todavía"], 
      correctAnswer: "todavía" 
    },
    { 
      id: 13, 
      dialogue: [
        { speaker: 'A', text: "¿___ te gusta más? ¿El día o la noche?" },
        { speaker: 'B', text: "El día." }
      ], 
      options: ["Quién", "Cuál", "Qué", "A cuál"], 
      correctAnswer: "Qué" 
    },
    { 
      id: 14, 
      dialogue: [{ speaker: 'A', text: "Antes no ___ nada, pero desde que tomo 'Sleepmador' duermo estupendamente." }], 
      options: ["dormí", "he dormido", "dormía", "duermo"], 
      correctAnswer: "dormía" 
    },
    { 
      id: 15, 
      dialogue: [{ speaker: 'A', text: "Cuando ___ a Marta, ___ en la ONU, pero ahora no sé qué hace." }], 
      options: ["conocí / trabajaba", "conozca / trabaja", "conocía / trabajó", "supe / laboró"], 
      correctAnswer: "conocí / trabajaba" 
    },
    { 
      id: 16, 
      context: "(Una madre a sus hijos)",
      dialogue: [{ speaker: 'A', text: "Niños, ___ los dientes antes de iros a la cama, por favor." }], 
      options: ["lavad", "os lavéis", "lavados", "lavaos"], 
      correctAnswer: "lavaos" 
    },
    { 
      id: 17, 
      context: "(Preparando una fiesta)",
      dialogue: [
        { speaker: 'A', text: "¿Compramos más vino?" },
        { speaker: 'B', text: "No creo que ___ necesario." }
      ], 
      options: ["esté", "está", "es", "sea"], 
      correctAnswer: "sea" 
    },
    { 
      id: 18, 
      context: "(En el coche)",
      dialogue: [
        { speaker: 'A', text: "¿Quieres que ___ yo un rato?" },
        { speaker: 'B', text: "No, deja, no estoy cansado." }
      ], 
      options: ["conducía", "conduzco", "conducir", "conduzca"], 
      correctAnswer: "conduzca" 
    },
    { 
      id: 19, 
      dialogue: [{ speaker: 'A', text: "Me pone de muy mal humor que ___ cuando estoy durmiendo la siesta." }], 
      options: ["me despiertan", "me despierten", "ser despertado", "despertarme"], 
      correctAnswer: "me despierten" 
    },
    { 
      id: 20, 
      context: "(Haciendo planes)",
      dialogue: [{ speaker: 'A', text: "Si ___ el domingo, no ___ a la playa." }], 
      options: ["lloverá / iremos", "llueva / iríamos", "llueve / vamos", "llovería / fuéramos"], 
      correctAnswer: "llueve / vamos" 
    },

    // --- NIVEL B1-B2 (Intermedio) ---
    { 
      id: 21, 
      context: "(Dos personas en la calle)",
      dialogue: [
        { speaker: 'A', text: "¿Tiene hora?" },
        { speaker: 'B', text: "No, pero ___ las tres o tres y diez." }
      ], 
      options: ["serán", "serían", "sean", "fueran"], 
      correctAnswer: "serán" 
    },
    { 
      id: 22, 
      context: "(Una madre a su hijo)",
      dialogue: [{ speaker: 'A', text: "Hasta que no te ___ la sopa, no te doy el helado." }], 
      options: ["acabas", "acabes", "terminas", "termines"], 
      correctAnswer: "acabes" 
    },
    { 
      id: 23, 
      dialogue: [
        { speaker: 'A', text: "A Raquel no hay quien la entienda. Habíamos hablado... y no llamó." },
        { speaker: 'B', text: "Bueno, puede ser que ___ de la cita." }
      ], 
      options: ["se olvidaría", "se olvidara", "se olvidó", "se olvidadaba"], 
      correctAnswer: "se olvidara" 
    },
    { 
      id: 24, 
      context: "(Un comentario personal)",
      dialogue: [{ speaker: 'A', text: "Me ___ colorado al hablar en público." }], 
      options: ["parezco", "hago", "vuelvo", "pongo"], 
      correctAnswer: "pongo" 
    },
    { 
      id: 25, 
      context: "(Un médico recetando)",
      dialogue: [{ speaker: 'A', text: "Cuando ___ tómese estas pastillas." }], 
      options: ["se levante", "se levantará", "se levantara", "se levantaría"], 
      correctAnswer: "se levante" 
    },
    { 
      id: 26, 
      context: "(En una ferretería)",
      dialogue: [{ speaker: 'A', text: "Perdone, ¿tiene algo ___ cerrar esta caja?" }], 
      options: ["puedo con que", "pueda con el", "con lo que pueda", "con el que puedo"], 
      correctAnswer: "con lo que pueda" 
    },
    { 
      id: 27, 
      context: "(Una invitación)",
      dialogue: [
        { speaker: 'A', text: "¿Por qué no te vienes mañana a esquiar?" },
        { speaker: 'B', text: "Me ___ esquiar, pero no ___." }
      ], 
      options: ["gustaba / puedo", "gusta / conozco", "gustará / sé", "gustaría / sé"], 
      correctAnswer: "gustaría / sé" 
    },
    { 
      id: 28, 
      dialogue: [
        { speaker: 'A', text: "No sé qué pasa pero Juan siempre se mete en líos." },
        { speaker: 'B', text: "¿Te han contado lo último? Siempre ___." }
      ], 
      options: ["se carga de trabajo", "se enamora", "se complica la vida", "llega tarde"], 
      correctAnswer: "se complica la vida" 
    },
    { 
      id: 29, 
      context: "(En la oficina a las once)",
      dialogue: [
        { speaker: 'A', text: "A las once siempre me da un hambre terrible." },
        { speaker: 'B', text: "Si te ___ antes, te ___ tiempo de desayunar." }
      ], 
      options: ["levantes / daría", "habrías levantado / daría", "levantaras / daría", "levantas / hubiera dado"], 
      correctAnswer: "levantaras / daría" 
    },
    { 
      id: 30, 
      context: "(Una pareja discutiendo)",
      dialogue: [
        { speaker: 'A', text: "¡Venga, no te pongas así! ¡Nos lo vamos a pasar muy bien!" },
        { speaker: 'B', text: "Por mucho que insistas, ___ pienso ir." }
      ], 
      options: ["por supuesto", "conque no", "no", "inclusive no"], 
      correctAnswer: "no" 
    },
    { 
      id: 31, 
      dialogue: [
        { speaker: 'A', text: "Mira, que esta tarde no voy a ir a tu casa." },
        { speaker: 'B', text: "¿___?" }
      ], 
      options: ["Por supuesto", "Es que", "Faltaría más", "Y eso"], 
      correctAnswer: "Y eso" 
    },
    { 
      id: 32, 
      context: "(Una noticia en el periódico)",
      dialogue: [{ speaker: 'System', text: '"El ministro ___ que ___ a dimitir."' }], 
      options: ["rechaza / poder", "niega / vaya", "insiste / fuera", "prometiera / iría"], 
      correctAnswer: "niega / vaya" 
    },
    { 
      id: 33, 
      dialogue: [{ speaker: 'A', text: "Nunca en mi vida ___ tanto como este mes." }], 
      options: ["he trabajado", "trabajo", "había trabajado", "trabajé"], 
      correctAnswer: "he trabajado" 
    },
    { 
      id: 34, 
      dialogue: [{ speaker: 'A', text: "El viernes ya no podía más, me metí en la cama y ___ toda la tarde." }], 
      options: ["estaba durmiendo", "estuve durmiendo", "dormí", "duermo"], 
      correctAnswer: "estuve durmiendo" 
    },
    { 
      id: 35, 
      dialogue: [
        { speaker: 'A', text: "¿Has leído el periódico? Unos científicos han inventado algo ___ podrían hacerse ricos rápidamente." }
      ], 
      options: ["con lo que", "con la que", "por la que", "por el que"], 
      correctAnswer: "con lo que" 
    },
    { 
      id: 36, 
      dialogue: [{ speaker: 'A', text: "Es normal que ___ una prueba de nivel antes de matricularnos." }], 
      options: ["hagamos", "hacer", "hacemos", "tendremos"], 
      correctAnswer: "hagamos" 
    },
    { 
      id: 37, 
      context: "(En una estación de autobuses)",
      dialogue: [{ speaker: 'A', text: "¿___ decirme si ha llegado el de Madrid?" }], 
      options: ["Debes", "Podría", "Querría", "Sabes que"], 
      correctAnswer: "Podría" 
    },
    { 
      id: 38, 
      context: "(Dos amigos hablando)",
      dialogue: [
        { speaker: 'A', text: "En mi ordenador se ven pelis en DVD." },
        { speaker: 'B', text: "¿Ah sí?, pues en ___ no." }
      ], 
      options: ["mi", "yo", "el mío", "mío"], 
      correctAnswer: "el mío" 
    },
    { 
      id: 39, 
      dialogue: [{ speaker: 'A', text: "Odio que me ___ cuando duermo la siesta." }], 
      options: ["despiertan", "despierten", "ser despertado", "despertarme"], 
      correctAnswer: "despierten" 
    },
    { 
      id: 40, 
      dialogue: [
        { speaker: 'A', text: "¡Qué raro que Arturo y su mujer se hayan separado!" },
        { speaker: 'B', text: "No sólo no se querían ___ se llevaban fatal." }
      ], 
      options: ["sino", "pero que", "sino que", "pero"], 
      correctAnswer: "sino que" 
    },
    { 
      id: 41, 
      dialogue: [
        { speaker: 'A', text: "¿Qué pasó el otro día?" },
        { speaker: 'B', text: "Rafael le preguntó si le ___ mucho y ella dijo que no. Así que pidió que le ___ uno igual." }
      ], 
      options: ["había costado / compraría", "costaría / comprara", "costaría / compraría", "había costado / comprara"], 
      correctAnswer: "había costado / comprara" 
    },
    { 
      id: 42, 
      dialogue: [
        { speaker: 'A', text: "Ponte crema antes ___ demasiado tarde." },
        { speaker: 'B', text: "No necesito crema." }
      ], 
      options: ["de que sea", "de ser", "que sea", "que es"], 
      correctAnswer: "de que sea" 
    },
    { 
      id: 43, 
      dialogue: [{ speaker: 'A', text: "No pienso quedarme en el jardín hasta que ___ de noche." }], 
      options: ["se haga", "se hará", "sea", "es"], 
      correctAnswer: "se haga" 
    },
    { 
      id: 44, 
      dialogue: [
        { speaker: 'A', text: "¿Tú crees que va a llover?" },
        { speaker: 'B', text: "En Londres nunca se sabe. Yo llevaría un paraguas por si las ___." }
      ], 
      options: ["lluvias", "moscas", "dudas", "veces"], 
      correctAnswer: "moscas" 
    },
    { 
      id: 45, 
      dialogue: [{ speaker: 'A', text: "Últimamente Álvaro siempre está a 'dos velas', y eso que no para de trabajar." }], 
      options: ["sin dinero", "muy cansado", "muy deprimido", "harto"], 
      correctAnswer: "sin dinero" 
    },
    { 
      id: 46, 
      dialogue: [{ speaker: 'A', text: "Por poco que ___, conseguirás aprobar." }], 
      options: ["estudies", "estudias", "estudiarías", "has estudiado"], 
      correctAnswer: "estudies" 
    },
    { 
      id: 47, 
      dialogue: [{ speaker: 'A', text: "___ al retraso de las ayudas, mereció la pena el proyecto." }], 
      options: ["Si bien", "A pesar de", "Aun", "Pese"], 
      correctAnswer: "Pese" 
    },
    { 
      id: 48, 
      dialogue: [
        { speaker: 'A', text: "¿Por cuánto te han salido las gafas?" },
        { speaker: 'B', text: "___ por unas veinte mil." }
      ], 
      options: ["Vienen a salir", "Devienen saliendo", "Acusan de salir", "Llegan saliendo"], 
      correctAnswer: "Vienen a salir" 
    },
    { 
      id: 49, 
      context: "(Pensando en las próximas vacaciones)",
      dialogue: [{ speaker: 'A', text: "De repente ___ una idea para solucionar el problema." }], 
      options: ["ocurrió", "se ocurrió", "me ocurrió", "se me ocurrió"], 
      correctAnswer: "se me ocurrió" 
    },
    { 
      id: 50, 
      dialogue: [{ speaker: 'A', text: "Me 'sacan de quicio' las puertas giratorias." }], 
      options: ["Me encantan", "No soporto", "Me revuelven", "Me vuelven loco"], 
      correctAnswer: "Me vuelven loco" 
    },

    // --- NIVEL C1-C2 (Avanzado) ---
    { 
      id: 51, 
      dialogue: [
        { speaker: 'A', text: "¿Sabes que a Pepe no le han dado la beca?" },
        { speaker: 'B', text: "¡Vaya por Dios! ¡___!" }
      ], 
      options: ["Con la falta que le hacía", "Estuvo desgraciado", "Fue decepcionante", "Qué mala pata"], 
      correctAnswer: "Con la falta que le hacía" 
    },
    { 
      id: 52, 
      context: "(Una madre amenaza a su hijo que no quiere comer)", 
      dialogue: [
        { speaker: 'A', text: "¿___ quieres tomarte la leche? Pues no hay postre." }
      ], 
      options: ["Por supuesto de que no", "Conque no", "Inclusive no", "A pesar así no"], 
      correctAnswer: "Conque no" 
    },
    { 
      id: 53, 
      dialogue: [
        { speaker: 'A', text: "¿Te gusta entonces el armario?" },
        { speaker: 'B', text: "Sí, pero yo le cambiaría los ___." }
      ], 
      options: ["pesos", "alfileres", "tiradores", "ojales"], 
      correctAnswer: "tiradores" 
    },
    { 
      id: 54, 
      context: "(Dos hermanas peleándose)",
      dialogue: [
        { speaker: 'A', text: "Seguro que me has cogido tú la falda." },
        { speaker: 'B', text: "¡___ mentirosa! La manchaste tú." }
      ], 
      options: ["Serás", "Eres", "Fuiste", "Serías"], 
      correctAnswer: "Serás" 
    },
    { 
      id: 55, 
      dialogue: [{ speaker: 'System', text: "\"El museo del Prado ___ una de las colecciones más importantes.\"" }], 
      options: ["adopta", "consulta", "cuenta con", "refiere a"], 
      correctAnswer: "cuenta con" 
    },
    { 
      id: 56, 
      dialogue: [
        { speaker: 'A', text: "¡Qué pequeña se te ha quedado la chaqueta!" },
        { speaker: 'B', text: "Sí, se ha ___ por lavarla con agua caliente." }
      ], 
      options: ["reducido", "empequeñecido", "disminuido", "encogido"], 
      correctAnswer: "encogido" 
    },
    { 
      id: 57, 
      context: "(Dos estudiantes comparando lenguas)",
      dialogue: [
        { speaker: 'A', text: "El español es más útil que el alemán." },
        { speaker: 'B', text: "¡Hombre, claro, ___!" }
      ], 
      options: ["dónde va a parar", "vete tú a saber", "quién lo diría", "ande yo caliente"], 
      correctAnswer: "dónde va a parar" 
    },
    { 
      id: 58, 
      dialogue: [{ speaker: 'System', text: "\"El hecho de que no ___ agua en el desierto, no ___ la presencia humana.\"" }], 
      options: ["haya / impide", "haya / impida", "hay / impida", "hay / impide"], 
      correctAnswer: "haya / impide" 
    },
    { 
      id: 59, 
      dialogue: [{ speaker: 'System', text: "\"Este modelo graba automáticamente. ___ su calidad de imagen y sonido es insuperable.\"" }], 
      options: ["En sentido opuesto que", "Ni que decir tiene que", "Sin necesidad de que", "Permitiendo que"], 
      correctAnswer: "Ni que decir tiene que" 
    },
    { 
      id: 60, 
      context: "(En una tienda de ropa)",
      dialogue: [
        { speaker: 'A', text: "Quería unos pantalones de verano." },
        { speaker: 'B', text: "¿Cómo ___ quiere?" }
      ], 
      options: ["son", "unos", "los", "ellos"], 
      correctAnswer: "los" 
    },
    { 
      id: 61, 
      dialogue: [{ speaker: 'A', text: "Normalmente ___ sobre las doce todos los días." }], 
      options: ["nos acuestamos", "nos acostamos", "se acostan", "acostarse"], 
      correctAnswer: "nos acostamos" 
    },
    { 
      id: 62, 
      context: "(En una entrevista de trabajo)",
      dialogue: [
        { speaker: 'A', text: "¿Y habla usted idiomas?" },
        { speaker: 'B', text: "Sí, estudio inglés ___ seis años." }
      ], 
      options: ["desde hace", "desde", "desde que", "al cabo de"], 
      correctAnswer: "desde hace" 
    },
    { 
      id: 63, 
      dialogue: [{ speaker: 'A', text: "Empecé a montar y ___ seis meses gané un premio." }], 
      options: ["desde hace", "desde", "desde que", "al cabo de"], 
      correctAnswer: "al cabo de" 
    },
    { 
      id: 64, 
      context: "(Un padre enfadado)",
      dialogue: [{ speaker: 'A', text: "¡Mira cómo tienes las manos! ___." }], 
      options: ["lávalas", "lávatelas", "lávelas", "láveselas"], 
      correctAnswer: "lávatelas" 
    },
    { 
      id: 65, 
      dialogue: [
        { speaker: 'A', text: "¿Te vienes a esquiar?" },
        { speaker: 'B', text: "Me ___ esquiar, pero no ___." }
      ], 
      options: ["gustaba / puedo", "gusta / conozco", "gustará / sé", "gustaría / sé"], 
      correctAnswer: "gustaría / sé" 
    },
    { 
      id: 66, 
      context: "(En una agencia de viajes)",
      dialogue: [
        { speaker: 'A', text: "¿Conoce Atenas?" },
        { speaker: 'B', text: "No, ___." }
      ], 
      options: ["no he estado nunca", "no estuve alguna vez", "no he estado alguna vez", "no estaba nunca"], 
      correctAnswer: "no he estado nunca" 
    },
    { 
      id: 67, 
      context: "(Dos amigas hablando)",
      dialogue: [
        { speaker: 'A', text: "¿Sabes que me empieza a gustar Javier? Pero, por favor Tere no ___ a nadie." },
        { speaker: 'B', text: "No te preocupes, soy una tumba." }
      ], 
      options: ["se lo cuentes", "le cuentas", "se le cuentes", "le cuentes"], 
      correctAnswer: "se lo cuentes" 
    },
    { 
      id: 68, 
      dialogue: [
        { speaker: 'A', text: "¿Le has dicho a Paco lo de la fiesta?" },
        { speaker: 'B', text: "Sí, ya ___ he dicho." }
      ], 
      options: ["le lo", "le", "se lo", "se le"], 
      correctAnswer: "se lo" 
    },
    { 
      id: 69, 
      dialogue: [{ speaker: 'A', text: "___ me han dado la beca, voy a dejar el trabajo." }], 
      options: ["Sin embargo", "Por que", "Entonces", "Como"], 
      correctAnswer: "Como" 
    },
    { 
      id: 70, 
      dialogue: [{ speaker: 'A', text: "Buscamos secretaria que ___ español e inglés." }], 
      options: ["hablando", "hable", "habla", "hablado"], 
      correctAnswer: "hable" 
    },
    { 
      id: 71, 
      context: "(Horóscopo)",
      dialogue: [{ speaker: 'System', text: "Tendrá una semana ocupada, es posible que ___ a una persona interesante." }], 
      options: ["sepa", "conozca", "supo", "conocerá"], 
      correctAnswer: "conozca" 
    },
    { 
      id: 72, 
      dialogue: [
        { speaker: 'A', text: "¿Cuándo te ___ unos días de descanso?" },
        { speaker: 'B', text: "Cuando ___." }
      ], 
      options: ["tomes / pueda", "tomarás / pueda", "tomarás / podré", "tomes / puedo"], 
      correctAnswer: "tomarás / pueda" 
    },
    { 
      id: 73, 
      dialogue: [{ speaker: 'A', text: "Estaba escribiendo y se apagó el ordenador. Me dio un ataque y ___ gritar." }], 
      options: ["me puse", "me puse a", "dejé de", "llevaba"], 
      correctAnswer: "me puse a" 
    },
    { 
      id: 74, 
      dialogue: [
        { speaker: 'A', text: "¿Por qué estudias español?" },
        { speaker: 'B', text: "___ trabajar en Latinoamérica." }
      ], 
      options: ["por", "a", "para", "porque"], 
      correctAnswer: "para" 
    },
    { 
      id: 75, 
      dialogue: [
        { speaker: 'A', text: "Oye, ¿te ha llamado alguien?" },
        { speaker: 'B', text: "No, no ha llamado ___." }
      ], 
      options: ["nadie", "nada", "alguien", "ninguno"], 
      correctAnswer: "nadie" 
    }
  ],
  writingTask: {
    title: "Expresión Escrita",
    context: `Lee atentamente la carta que acabas de recibir de una española. Después redacta una respuesta:

"Hola, ¿qué tal?
Me llamo Fuencisla. Soy una muchacha castellana de 20 años, a la que le gustaría contactar con estudiantes de español. Vivo con mis padres y tres hermanas en un pequeño pueblo de Segovia. La vida aquí es bastante aburrida: hay más ovejas que habitantes. Por eso me gustaría conocer otros sitios, qué hace la gente en ciudades como Londres. A mí me interesa sobre todo la música moderna: toco la guitarra en un grupo de música 'heavy', y he dejado de estudiar para dedicarme a la vida artística. Me encantaría que me contaras cómo es tu ciudad y cuál es la mejor época para visitarla. Si te interesa hacer nuevos amigos, ¿por qué no me escribes y me hablas un poco de ti: cómo eres, qué haces, qué te gusta...?
Hasta pronto,
Fuencisla"`,
    prompt: "Escribe una respuesta a Fuencisla hablándole de ti, tu ciudad, tus gustos y respondiendo a sus preguntas. (Mínimo 80 palabras)",
    minWords: 80
  }
};
