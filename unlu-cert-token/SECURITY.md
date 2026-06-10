# Reporte de Seguridad y Auditoría (SECURITY.md)

## Tabla de Hallazgos de Slither

Le siguiente tabla detalla los hallazgos reportados por Slither correspondientes al contrato [AcademicCredentials.sol](https://github.com/tomasdelvechio/tp-final-dapps-diplo-blockchain/blob/main/unlu-cert-token/src/AcademicCredentials.sol), ignorando las librerías y dependencias externas de OpenZeppelin, que daban muchisimos falsos positivos. Sin embargo, la salida completa de slither [puede ser consultada](https://github.com/tomasdelvechio/tp-final-dapps-diplo-blockchain/blob/main/unlu-cert-token/docs/slither-output.txt) en el repositorio.

| Finding                                                                                                         | Severidad   | ¿Real? | Como lo arreglé / por qué es false positive                                                                                                                                                                                                                                                                                                                                                                                                   |
|:--------------------------------------------------------------------------------------------------------------- |:----------- |:------ |:--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Uso de Timestamp (`timestamp`)**<br>En la función `verify(uint256)` al comprobar `cred.active`.               | Baja / Info | ❌ No   | **Falso Positivo.** Slither detecta que la función lee la estructura `Credential`, la cual incluye el campo `issueDate` (inicializado con `block.timestamp` en `issueCredential`). Sin embargo, en `verify` no se realiza ninguna comparación lógica de marcas de tiempo ni se afecta el flujo de control del contrato basándose en la hora actual del bloque. Es puramente informativo y libre de riesgos de *Block Timestamp Manipulation*. |
| **Versión del Compilador y Pragma (`solc-version` / `pragma`)**<br>Uso del constraint `^0.8.20` en la cabecera. | Baja / Info | Sí     | **Mitigado.** El pragma `^0.8.20` permite el uso de compiladores con bugs conocidos. Para evitar estos problemas, en la configuración de compilación de Foundry ([foundry.toml](file:///home/tomas/workspace/diplomatura-blockchain/dApps/tp-final/unlu-cert-token/foundry.toml)) se fija de forma estricta y segura la versión del compilador a `0.8.28`, la cual solventa todas las vulnerabilidades de la versión inicial `0.8.20`.        |

---

## 📋 Checklist Obligatorio de Seguridad

- [x] **Solidity 0.8.20+ (overflow protection nativa):** El contrato utiliza `pragma solidity ^0.8.20;`. El uso de Solidity `0.8` o superior garantiza la comprobación nativa contra desbordamientos (overflow y underflow) sin necesidad de utilizar librerías externas de matemáticas seguras como SafeMath.
- [x] **`AccessControl` correctamente aplicado:** Se implementa el contrato `AccessControl` de OpenZeppelin. El rol de administrador por defecto (`DEFAULT_ADMIN_ROLE`) gestiona los emisores, y el rol `ISSUER_ROLE` tiene el control exclusivo sobre la emisión y revocación de credenciales. Las funciones correspondientes están protegidas con el modificador `onlyRole`.
- [x] **Eventos en TODA mutación de estado:** Se emiten eventos en todas las operaciones críticas que modifican el almacenamiento de la blockchain:
  - `grantIssuer` emite `IssuerGranted`.
  - `revokeIssuer` emite `IssuerRevoked`.
  - `issueCredential` emite `CredentialIssued` (además del evento estándar `Transfer` de ERC-721 para la acuñación).
  - `revoke` emite `CredentialRevoked` (además del evento estándar `Transfer` para la quema).
- [x] **Validación de inputs:** Todas las funciones verifican sus parámetros de entrada mediante sentencias `require`:
  - Se prohíbe el uso de `address(0)` tanto para estudiantes como para administración de emisores.
  - Se prohíbe que el `studentNameHash` o el `documentHash` sean vacíos (`bytes32(0)`).
  - Se prohíbe que el `degreeName` o el `metadataURI` sean strings vacíos.
  - La duplicación de un `tokenId` es evitada automáticamente por la validación nativa de la función `_mint` de OpenZeppelin, que revierte si el token ya está en posesión de alguna cuenta.
- [x] **Soulbound implementado correctamente:** El contrato sobreescribe de forma segura la función interna `_update` de la especificación ERC-721:
  
  ```solidity
  function _update(address to, uint256 tokenId, address auth)
      internal
      override(ERC721)
      returns (address)
  {
      address from = _ownerOf(tokenId);
      if (from != address(0) && to != address(0)) {
          revert("Soulbound: non-transferable");
      }
      return super._update(to, tokenId, auth);
  }
  ```
  
  Esto bloquea cualquier intento de transferencia entre dos direcciones válidas, limitando la transferencia únicamente a procesos de acuñación (`from == address(0)`) y quema/revocación (`to == address(0)`).
- [x] **Sin funciones peligrosas de control de flujo o auth:** No se utiliza `selfdestruct`, no hay llamadas delegadas dinámicas (`delegatecall`), y las verificaciones de autorización se basan exclusivamente en `msg.sender` (evitando por completo el uso de `tx.origin`).
- [x] **`documentHash` es de tipo `bytes32`:** Para garantizar la máxima eficiencia en gas y la integridad del archivo PDF adjunto, el hash del documento se almacena y maneja como `bytes32` en lugar de una representación en cadena de texto (`string`).

---

## 🔍 Análisis Propio de Amenazas y Vectores de Ataque

Todo el analisis a continuación asume la implementación actual del repositorio (Junio 2026). Se entiende que la misma es deficiente y se dan indicios de posibles caminos a adoptar a futuro.

### 1. Pérdida de la clave del Administrador (`DEFAULT_ADMIN_ROLE`)

En la implementación actual, el creador del contrato recibe el rol `DEFAULT_ADMIN_ROLE` en el constructor. Si el rector de la universidad (poseedor de esta clave privada) pierde la wallet o sus palabras semilla, el contrato entrará en un estado de **bloqueo administrativo irreversible**. No se podrán agregar nuevos emisores (`ISSUER_ROLE`) ni retirar permisos a emisores actuales si alguna de sus cuentas se ve comprometida.

* **Estrategia de mitigación y recuperación:** La wallet inicial del rector no debería ser una cuenta de clave única (EOA). El despliegue debe asignar el control administrativo a una wallet multifirma (por ejemplo, **Gnosis Safe**) gestionada de forma colectiva por múltiples autoridades académicas (ej. Rectorado, Secretaría Académica, Dirección de Sistemas). De este modo, si una de las firmas individuales se pierde, las firmas restantes pueden ejecutar una recuperación o reconfiguración de la administración. Ademas esto es necesario por el recambio natural de autoridades y personal de las instituciones. Todo esto queda fuera del alcance de este proyecto.

### 2. Compromiso de una wallet Emisora (`ISSUER_ROLE`)

En caso de que un atacante consiga acceso a las llaves privadas de una cuenta con rol de emisor (como una secretaría académica de facultad), este podrá llamar inmediatamente a la función `issueCredential` e emitir una cantidad indefinida de certificados falsos hacia direcciones de su elección en cuestión de segundos. Asimismo, podría revocar títulos legítimos llamando a `revoke`.

* **Estimación de impacto y detección:** Al ejecutarse en una red de Layer 2 como Base Sepolia (con tiempos de bloque de ~2 segundos y fees casi imperceptibles), un script automatizado del atacante podría emitir cientos o miles de credenciales truchas antes de que un operador humano lo note. La detección se realiza mediante el monitoreo off-chain de los eventos `CredentialIssued` (usando herramientas como Defender Sentinels o Tenderly alerts).
* **Procedimiento de contingencia:**
  1. El administrador (`DEFAULT_ADMIN_ROLE`) debe llamar a `revokeIssuer(addressComprometida)` para retirar los privilegios de emisión de inmediato.
  2. Se debe realizar una auditoría de los últimos bloques para identificar todos los `tokenId` generados durante el período de compromiso.
  3. Dado que los tokens son *Soulbound*, no pueden transferirse fuera de las wallets atacantes. Una wallet emisora autorizada legítima deberá proceder a llamar a `revoke` para cada credencial inválida, dejando registro on-chain de su invalidez (`active = false` y quemada).

### 3. Emisión de credenciales con datos erróneos

Si un emisor comete una equivocación manual durante el proceso de acuñación (por ejemplo, asocia un `tokenId` al alumno equivocado, escribe mal el nombre de la carrera o introduce un hash de documento corrupto), la naturaleza Soulbound del token impide que el alumno pueda devolver el token o transferirlo al estudiante correcto.

* **Corrección y Trazabilidad:** Para enmendar el error sin perder la auditoría histórica:
  1. El emisor debe llamar a `revoke(tokenId, "Error de carga: Datos de estudiante incorrectos")`. Esto marca el estado de la credencial como inactivo y destruye el token (quema).
  2. Posteriormente, el emisor genera una nueva credencial con un nuevo `tokenId` y los datos corregidos para el estudiante correspondiente.
  3. Este flujo es transparente y auditable: cualquier verificador podrá comprobar que la credencial inicial fue expresamente anulada por la universidad debido a un error administrativo, y que la nueva credencial es la válida, garantizando trazabilidad total.

### 4. Riesgos de Front-Running

El front-running en blockchains públicas ocurre cuando un actor malicioso ve una transacción en el mempool y paga un precio de gas más alto para que su transacción se ejecute primero.

* **Análisis del vector en este contrato:**
  - Para la administración de roles (`grantIssuer`, `revokeIssuer`) y las mutaciones de estado académicas (`issueCredential`, `revoke`), el contrato utiliza el modificador `onlyRole`. Por ende, si un atacante copia una transacción del mempool modificando los parámetros, la transacción revertirá porque la dirección del atacante no posee el rol requerido.
  - El único caso de competencia (race condition) ocurriría si dos emisores legítimos intentan emitir por separado una credencial usando el mismo `tokenId` exacto al mismo tiempo en el mempool. La transacción que sea procesada primero (por ejemplo, la que ofrezca mayor gas) se acuñará con éxito, mientras que la segunda fallará por duplicado. Esto no representa una vulnerabilidad de seguridad, sino una colisión operativa mitigable mediante un secuenciador incremental de IDs en el frontend o servidor emisor.

### 5. Privacidad y ataques de diccionario contra el `studentNameHash`

El campo `studentNameHash` se define como el hash criptográfico `keccak256(Nombre Completo + DNI)` para evitar almacenar datos personales en claro (cumplimiento de regulaciones de privacidad como GDPR). Sin embargo, al ser un hash estático guardado de forma pública en la blockchain, es vulnerable a ataques de fuerza bruta o diccionario.

* **Viabilidad del ataque:** El espacio de búsqueda es sumamente reducido. El DNI en Argentina consta de un número de 8 dígitos, lo cual representa un espacio de apenas 50 millones de posibilidades. Si un atacante conoce el nombre completo de una persona (fácil de obtener por redes sociales u otras bases públicas) y desea adivinar su DNI, o viceversa, puede precalcular los 50 millones de hashes correspondientes en pocos segundos mediante un script en una GPU ordinaria, comparándolos con el hash público de la credencial.
* **Mitigación recomendada:** Para neutralizar los ataques de diccionario, la solución recomendada es añadir entropía al proceso de hashing introduciendo una **sal criptográfica (salt)** de alta entropía gestionada de forma privada por la universidad y provista al alumno:
  
  ```solidity
  // studentNameHash = keccak256(abi.encodePacked(nombreCompleto, dni, saltPrivado))
  ```
  
  Sin conocimiento del `saltPrivado`, es computacionalmente imposible para un tercero adivinar el nombre o el DNI del alumno asociado a la credencial, protegiendo con total seguridad su identidad digital. Vale la aclaración que esta sal y el hash debe hacerse en la capa de backend/web2, porque el código y estado del contrato es completamente público y decodificable.
