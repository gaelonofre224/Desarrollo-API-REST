
## ¿Qué es GraphQL?

GraphQL es un lenguaje de consulta de datos para APIs y un entorno de ejecución del lado del servidor encargado de resolver dichas consultas utilizando un sistema de tipos definido para los datos.

A diferencia de otros sistemas, GraphQL no está atado a ninguna base de datos ni motor de almacenamiento específico. En su lugar, actúa como una capa intermedia que se respalda en el código y las fuentes de datos ya existentes (bases de datos SQL, NoSQL, microservicios o incluso otras APIs REST).

### ¿Cómo funciona?
En una API tradicional (como REST), el servidor define qué datos devuelve cada URL o ruta. Con GraphQL, el flujo cambia: el cliente es quien especifica exactamente qué datos y propiedades necesita, y el servidor responde con un objeto JSON que tiene exactamente la misma estructura solicitada.

* **Ejemplo de consulta enviada por el cliente:**
```graphql
query {
  usuario(id: "101") {
    nombre
    correo
    cursos {
      titulo
    }
  }
}
```

* **Respuesta exacta del servidor:**
```json
{
  "data": {
    "usuario": {
      "nombre": "Carlos Mendoza",
      "correo": "carlos@ejemplo.com",
      "cursos": [
        { "titulo": "Desarrollo Web" },
        { "titulo": "Bases de Datos" }
      ]
    }
  }
}
```

### 1.3 Características Principales de GraphQL
1. **Un único punto de acceso:** Mientras que las APIs tradicionales exponen decenas de URLs, GraphQL expone un único endpoint central por donde pasan todas las peticiones.
2. **Eliminación del Over-fetching:** Evita que el cliente descargue campos que no va a mostrar en pantalla, ahorrando ancho de banda y mejorando la velocidad.
3. **Eliminación del Under-fetching:** Permite obtener datos de varios recursos relacionados entre sí en una sola llamada de red, en lugar de hacer múltiples peticiones en cascada.
4. **Operaciones bien definidas:**
   * **Queries:** Utilizadas exclusivamente para leer o consultar información (equivalente a `GET`).
   * **Mutations:** Utilizadas para crear, modificar o eliminar información en el servidor (equivalente a `POST`, `PUT`, `DELETE`).
   * **Subscriptions:** Utilizadas para mantener una conexión abierta y recibir datos en tiempo real cuando ocurre un evento.
5. **Auto-documentación:** Gracias a su estructura tipada, GraphQL permite que herramientas de desarrollo generen documentación interactiva de manera automática para que los programadores consulten qué datos están disponibles.

### 1.4 Cuadro Comparativo: GraphQL vs. REST

| Característica | API REST | API GraphQL |
| :--- | :--- | :--- |
| **Puntos de acceso (URLs)** | Múltiples rutas según el recurso (`/usuarios`, `/posts`). | Un único punto de acceso (`/graphql`). |
| **Control de los datos** | El servidor decide qué campos se envían en la respuesta. | El cliente decide exactamente qué campos quiere recibir. |
| **Obtención de relaciones** | Requiere llamar a varias URLs para juntar datos relacionados. | Obtiene el recurso principal y sus relaciones en una sola petición. |
| **Tipado de datos** | Débil o dependiente de documentación externa (como Swagger). | Fuertemente tipado de forma nativa mediante su esquema (SDL). |

---

## ¿Qué es SDL (Schema Definition Language)?

### Definición de SDL
SDL son las siglas de **Schema Definition Language**. Es la sintaxis oficial y declarativa que utiliza GraphQL para escribir y definir el Esquema de una API.

El esquema escrito en SDL funciona como un **contrato estricto** entre el Frontend (cliente) y el Backend (servidor):
* Le indica al **cliente** qué tipos de datos existen, cómo se relacionan entre sí y qué consultas o modificaciones tiene permitido hacer.
* Le indica al **servidor** cómo debe validar las peticiones entrantes antes de ejecutarlas.

Su principal ventaja es que es un lenguaje **agnóstico al lenguaje de programación**: se escribe igual sin importar si el servidor está programado en JavaScript (Node.js), Python, Java, C# o PHP.

### Componentes y Sintaxis del SDL

Para construir un esquema usando SDL, se utilizan los siguientes bloques de construcción fundamentales:

#### A. Tipos de Objeto y Campos
Son el elemento básico de un esquema. Representan una entidad del sistema (como un `Usuario`, un `Libro` o un `Producto`) y contienen una lista de campos con su respectivo tipo de dato.

```graphql
type Libro {
  id: ID!
  titulo: String!
  paginas: Int
  disponible: Boolean!
  autor: Autor!
}
```

#### B. Tipos Escalares
Son los datos primitivos donde terminan las consultas (las "hojas" del árbol de datos). SDL incluye 5 tipos escalares por defecto:
* `Int`: Número entero de 32 bits con signo.
* `Float`: Número con punto decimal.
* `String`: Cadena de texto (formato UTF-8).
* `Boolean`: Valor verdadero o falso (`true` / `false`).
* `ID`: Identificador único (se serializa como texto, pero indica que no está pensado para ser leído por humanos, sino para identificar registros).

#### C. Modificadores de Tipo (Nulabilidad y Listas)
En SDL, los signos de exclamación y los corchetes modifican el comportamiento de un campo:
* **Signo de exclamación (`!`):** Indica que el campo es **obligatorio (No nulo)**. Por ejemplo, `String!` garantiza que el servidor siempre devolverá un texto y nunca `null`.
* **Corchetes (`[ ]`):** Indican que el campo devuelve una **lista o arreglo** de elementos. Por ejemplo, `[Libro]` representa una lista de libros.

#### D. Tipos de Operación Raíz
Son los puntos de entrada especiales dentro del SDL que definen qué acciones puede realizar el cliente:
* `type Query`: Lista todas las consultas de lectura disponibles.
* `type Mutation`: Lista todas las funciones de creación, edición o borrado.
* `type Subscription`: Lista los eventos en tiempo real a los que el cliente se puede suscribir.

```graphql
type Query {
  obtenerLibros: [Libro!]!
  buscarLibroPorId(id: ID!): Libro
}

type Mutation {
  agregarLibro(titulo: String!, paginas: Int): Libro!
  eliminarLibro(id: ID!): Boolean!
}
```

#### E. Tipos Avanzados en SDL: Inputs, Enums, Interfaces y Uniones
1. **`enum` (Enumeraciones):** Restringe el valor de un campo a una lista fija de opciones permitidas.
   ```graphql
   enum RolUsuario {
     ADMIN
     EDITOR
     LECTOR
   }
   ```
2. **`input` (Tipos de Entrada):** Permite agrupar varios campos dentro de un objeto para pasarlos fácilmente como parámetro en una mutación o consulta.
   ```graphql
   input CrearAutorInput {
     nombre: String!
     nacionalidad: String!
   }
   ```
3. **`interface` (Interfaces):** Define un conjunto de campos base que varios tipos de objetos deben incluir obligatoriamente.
4. **`union` (Uniones):** Permite expresar que un campo puede devolver uno de entre varios tipos de objetos distintos (por ejemplo, un buscador que devuelve tanto `Libro` como `Autor`).

---

### Ejemplo Completo de un Esquema en SDL

A continuación, se muestra cómo luce un archivo de esquema completo escrito en **SDL** que integra todos los elementos anteriores:

```graphql
# 1. Definición de una Enumeración
enum CategoriaCurso {
  PROGRAMACION
  DISENO
  MATEMATICAS
}

# 2. Definición de Tipos de Objeto y sus relaciones
type Profesor {
  id: ID!
  nombre: String!
  especialidad: String
  cursosImpartidos: [Curso!]!
}

type Curso {
  id: ID!
  titulo: String!
  horasDuracion: Int!
  activo: Boolean!
  categoria: CategoriaCurso!
  profesor: Profesor!
}

# 3. Definición de un Input para recibir datos estructurados
input NuevoCursoInput {
  titulo: String!
  horasDuracion: Int!
  categoria: CategoriaCurso!
  profesorId: ID!
}

# 4. Puntos de entrada: Consultas (Queries)
type Query {
  listarCursos: [Curso!]!
  obtenerCurso(id: ID!): Curso
  listarProfesores: [Profesor!]!
}

# 5. Puntos de entrada: Modificaciones (Mutations)
type Mutation {
  crearCurso(datos: NuevoCursoInput!): Curso!
  cambiarEstadoCurso(id: ID!, activo: Boolean!): Curso!
}
```