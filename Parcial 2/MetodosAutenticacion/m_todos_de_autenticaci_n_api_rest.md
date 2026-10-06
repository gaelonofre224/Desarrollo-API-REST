# Métodos de Autenticación en API REST

## Basic Authentication

### Descripción
Definida en la especificación RFC 7617 e implementada nativamente en la mayoría de navegadores y servidores HTTP, es el esquema más elemental. Consiste en combinar el identificador de usuario y la contraseña con dos puntos (usuario:contraseña) y enviar la cadena resultante codificada en formato Base64.

### Formato de Encabezado HTTP
``
Authorization: Basic dXN1YXJpbzpjb250cmFzZcOxYQ==
``

### Características Técnicas
* **Seguridad en tránsito:** Base64 no es un cifrado criptográfico, sino una simple codificación reversible. Por tanto, el uso de **HTTPS/TLS es obligatorio** para evitar que las credenciales sean interceptadas en la red.
* **Flujo del servidor:** Si el cliente intenta consultar un recurso protegido sin credenciales, el servidor devuelve un código '401 Unauthorized' acompañado del encabezado `WWW-Authenticate: Basic realm="Zona Protegida"`.
* **Uso común:** Entornos de desarrollo, microservicios internos aislados o pruebas rápidas.

---

## Digest Access Authentication

### Descripción
Definida en la especificación RFC 7616, se diseñó originalmente para mitigar las debilidades de la autenticación básica sin requerir forzosamente un canal seguro SSL/TLS, empleando un mecanismo de desafío y respuesta.

### Formato de Encabezado HTTP
``
Authorization: Digest username="admin", realm="api@empresa.com", nonce="dcd98b7102dd2f0e8b11d0f600bfb0c093", uri="/api/v1/usuarios", response="6629fae49393a05397450978507c4ef1"
``

### Características Técnicas
* **Protección de contraseña:** La contraseña nunca viaja en texto plano. El cliente calcula un hash (usualmente MD5 o SHA-256) combinando credenciales, el método HTTP, la URI y un valor aleatorio de un solo uso enviado por el servidor llamado nonce.
* **Mitigación de ataques:** Al incluir el nonce y contadores de petición (`nc`), protege frente a ataques de repetición.
* **Estado actual:** Prácticamente en desuso en el diseño moderno de APIs REST debido a su sobrecarga de procesamiento, incompatibilidad con arquitecturas completamente sin estado y la adopción universal de HTTPS.

---

## 3. Bearer Token

### Descripción
Regulado por el estándar RFC 6750, es el esquema en el que la posesión o porte del token otorga autorización para acceder a los recursos asociados. Cualquier entidad que presente el token ante el servidor es considerada autorizada sin necesidad de aportar pruebas criptográficas adicionales de posesión de clave privada.

### Formato de Encabezado HTTP
``
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
``

### Características Técnicas
* **Desacoplamiento:** El cliente no almacena ni transmite contraseñas en cada petición; únicamente conserva un token emitido tras un inicio de sesión previo.
* **Formato agnóstico:** El estándar no impone un formato interno: puede ser un opaque token con lookup en memoria/base de datos o un token estructurado.
* **Riesgo crítico:** Como indica la guía de seguridad de OWASP, si un token de portador es interceptado o filtrado, el atacante obtiene control total durante la vida útil del mismo. Su uso exige estrictamente canales HTTPS y tiempos de vida útiles acotados.

---

## API Key

### Descripción
Una clave de API es un identificador alfanumérico único generado por el servidor y asignado a un desarrollador o aplicación cliente. Es muy popular en plataformas de servicios públicos (como Google Maps, Stripe, SendGrid o AWS).

### Formatos de Envío
1. **Encabezado HTTP personalizado:**
   ``
   X-API-Key: abc12345xyz67890
   ``
2. **Parámetro de consulta en la URL:**
   ``
   GET /v1/datos?api_key=abc12345xyz67890
   ``
   *(Evitar esta modalidad, ya que las claves quedan registradas en logs de servidores proxy, cachés e historial del navegador).*

### Características Técnicas
* **Identificación vs. Autenticación:** Se utiliza principalmente para identificar **proyectos, servidores o aplicaciones**, no para autenticar usuarios individuales finales.
* **Control de tráfico:** Facilita la medición del consumo de recursos, rate limiting o 429 Too Many Requests y control de facturación.
* **Seguridad:** No debe exponerse en repositorios públicos ni incrustarse directamente en el código fuente de aplicaciones frontend (como React o aplicaciones móviles descompilables).

---

## JSON Web Token

### Descripción
Definido en el estándar RFC 7519, un JWT es un contenedor compacto y seguro basado en JSON para transmitir claims verificables entre partes. Es una de las implementaciones más habituales de tokens Bearer en APIs REST modernas.

### Estructura de un JWT
Un JWT está compuesto por tres secciones codificadas en Base64Url y separadas por puntos (`Header.Payload.Signature`):

1. **Header:** Contiene metadatos como el tipo de token (`typ: "JWT"`) y el algoritmo criptográfico empleado (`alg: "HS256"`, `RS256`, etc.).
2. **Payload:** Alberga los datos o declaraciones (claims), tales como el identificador del usuario (`sub`), emisor (`iss`), audiencia (`aud`) y fecha de caducidad (`exp`).
3. **Signature:** Firma generada al tomar el Header y el Payload codificados junto con una clave secreta (clave simétrica HMAC) o privada (clave asimétrica RSA/ECDSA). Permite certificar que los datos no han sido modificados.

### Consideraciones de Seguridad (OWASP Cheat Sheet)
* **Stateless:** El servidor valida la firma matemáticamente con su clave sin tener que realizar consultas a bases de datos en cada petición, lo que favorece la escalabilidad horizontal.
* **Privacidad de datos:** A menos que se use cifrado JWE, el Payload de un JWT es legible por cualquiera que tenga acceso al token. **Nunca deben colocarse contraseñas ni datos sensibles en el payload.**
* **Revocación:** Al no consultar base de datos, revocar un token antes de su vencimiento requiere listas de revocación en memoria (*denylists* o *Token Status Lists*).

---

## OAuth

### Descripción
OAuth 2.0 no es un mecanismo de autenticación en sentido estricto, sino un *delegated authorization framework*. Permite que una aplicación cliente obtenga acceso limitado a recursos protegidos de un usuario en un servidor tercero (como Google, GitHub o Facebook) sin que el usuario revele sus credenciales a dicha aplicación.

### Roles en la Arquitectura OAuth
* **Resource Owner:** El usuario dueño de los datos.
* **Client:** La aplicación que desea acceder a los recursos del usuario.
* **Authorization Server:** Servidor que autentica al usuario y emite los tokens de acceso tras recibir el consentimiento.
* **Resource Server:** La API REST que aloja y sirve los datos protegidos.

### Flujo Típico (Authorization Code con PKCE)
1. El usuario es redirigido al servidor de autorización e inicia sesión de forma segura.
2. Da consentimiento a los permisos solicitados.
3. La aplicación cliente recibe un código de autorización temporal y lo intercambia internamente por un `Access Token`.
4. La aplicación consume la API REST enviando el `Access Token` en el encabezado `Authorization: Bearer <token>`.

### Autenticación Federada
Dado que OAuth 2.0 solo provee autorización, la industria extendió este estándar mediante **OpenID Connect (OIDC)**, el cual añade una capa formal de autenticación de identidad devolviendo un `ID Token` (un JWT con perfil de usuario), habilitando botones como "Iniciar sesión con Google".