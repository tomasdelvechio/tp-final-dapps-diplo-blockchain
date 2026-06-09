# Decisiones Técnicas Adoptadas - AcademicCredentials.sol

Este documento detalla las decisiones técnicas adoptadas e implementadas en el contrato [AcademicCredentials.sol](file:///home/tomas/workspace/diplomatura-blockchain/dApps/tp-final/unlu-cert-token/src/AcademicCredentials.sol), basándose en los lineamientos de arquitectura y modelado de datos de la universidad.

## 1. Arquitectura y Modelado de Datos

El diseño del contrato adopta un modelo híbrido on-chain/off-chain para optimizar el consumo de gas, proteger la privacidad y garantizar la inmutabilidad y disponibilidad de la certificación.

### Struct `Credential`

La información básica de la credencial académica se modela en la estructura [Credential](file:///home/tomas/workspace/diplomatura-blockchain/dApps/tp-final/unlu-cert-token/src/AcademicCredentials.sol#L20-L26):

* **`degreeName`** (string): Almacena directamente on-chain el nombre del título (ej: *"Licenciatura en Sistemas de Información"*). Facilita la legibilidad y auditoría directa.
* **`studentNameHash`** (bytes32): Hash `keccak256` del nombre completo del estudiante junto con su DNI (`keccak256(Nombre Completo + DNI)`).
  * *Razón de diseño*: Privacidad. La blockchain es pública; almacenar nombres y DNI en texto plano vulneraría leyes de protección de datos personales. Al usar un hash (commitment scheme), solo un agente verificador que posea los datos del estudiante de forma legítima puede cotejarlos y confirmar la validez on-chain.
* **`issueDate`** (uint256): Timestamp de emisión obtenido mediante `block.timestamp`.
* **`documentHash`** (bytes32): Hash `keccak256` del archivo PDF original del diploma emitido por la institución.
  * *Razón de diseño*: Integridad del documento físico/digital. Permite verificar que un PDF provisto por el egresado coincide exactamente con el emitido por la universidad, independientemente del estado de la red de metadatos.
* **`active`** (bool): Indicador lógico de validez de la credencial (activo = `true`, revocado = `false`).

### Off-chain Storage (`metadataURI`)

* El contrato implementa la extensión [ERC721URIStorage](file:///home/tomas/workspace/diplomatura-blockchain/dApps/tp-final/unlu-cert-token/src/AcademicCredentials.sol#L5) para vincular un identificador off-chain (`ipfs://` o similar) con metadatos descriptivos en formato JSON.
* *Mitigación ante fallos*: Si el servidor IPFS o de metadatos se cae o se pierde, la validez legal e integridad del título académico siguen garantizadas on-chain. El verificador puede seguir comparando el hash del PDF del egresado directamente contra `documentHash` en la blockchain de forma autónoma.

---

## 2. Control de Acceso basado en Roles (AccessControl)

Se prescinde del módulo simplista `Ownable` en favor de [AccessControl](file:///home/tomas/workspace/diplomatura-blockchain/dApps/tp-final/unlu-cert-token/src/AcademicCredentials.sol#L6) de OpenZeppelin, para acomodar una jerarquía institucional adecuada:

* **`DEFAULT_ADMIN_ROLE`** (Rector / Administrador): Administra a los emisores del sistema mediante las funciones públicas [grantIssuer](file:///home/tomas/workspace/diplomatura-blockchain/dApps/tp-final/unlu-cert-token/src/AcademicCredentials.sol#L74-L78) y [revokeIssuer](file:///home/tomas/workspace/diplomatura-blockchain/dApps/tp-final/unlu-cert-token/src/AcademicCredentials.sol#L82-L86). Este rol no tiene la potestad de emitir credenciales por sí solo.
* **`ISSUER_ROLE`** (Decanos / Oficinas de Alumnos): Poseen autorización para emitir credenciales académicas ([issueCredential](file:///home/tomas/workspace/diplomatura-blockchain/dApps/tp-final/unlu-cert-token/src/AcademicCredentials.sol#L99-L128)) y revocarlas en caso de ser necesario ([revoke](file:///home/tomas/workspace/diplomatura-blockchain/dApps/tp-final/unlu-cert-token/src/AcademicCredentials.sol#L133-L141)).

Esta separación limita el radio de impacto ante el compromiso de una clave privada.

---

## 3. Soulbound Tokens (NFT No Transferibles)

Un título universitario pertenece única y exclusivamente a quien lo obtuvo; no puede ser vendido, prestado ni robado.

* **Implementación**: Se sobrescribe la función interna [_update](file:///home/tomas/workspace/diplomatura-blockchain/dApps/tp-final/unlu-cert-token/src/AcademicCredentials.sol#L149-L159) de ERC-721:
  
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

* **Lógica**: Si una transferencia ocurre entre dos wallets válidas (`from != address(0)` y `to != address(0)`), la ejecución falla. Únicamente se permiten las operaciones de acuñamiento (`from == address(0)`) y destrucción (`to == address(0)`).

---

## 4. Ciclo de Vida: Emisión y Revocación

### Emisión ([issueCredential](file:///home/tomas/workspace/diplomatura-blockchain/dApps/tp-final/unlu-cert-token/src/AcademicCredentials.sol#L99))

Acuña un NFT directamente a la wallet del egresado, asocia su `metadataURI` y crea el struct `Credential` correspondiente en el mapping global. Requiere explícitamente ser llamado por una dirección autorizada con `ISSUER_ROLE`.

* Cuenta con controles para evitar que se envíen campos en cero o vacíos.
* Lanza el evento [CredentialIssued](file:///home/tomas/workspace/diplomatura-blockchain/dApps/tp-final/unlu-cert-token/src/AcademicCredentials.sol#L36-L41) para indexación y consumo en el frontend.

### Revocación ([revoke](file:///home/tomas/workspace/diplomatura-blockchain/dApps/tp-final/unlu-cert-token/src/AcademicCredentials.sol#L133))

Permite anular administrativamente un título en caso de errores en la carga o fraudes detectados.

* El emisor (`ISSUER_ROLE`) establece la bandera `active` de la credencial en `false` y quema el NFT (`_burn`).
* Lanza el evento [CredentialRevoked](file:///home/tomas/workspace/diplomatura-blockchain/dApps/tp-final/unlu-cert-token/src/AcademicCredentials.sol#L43-L48) guardando el motivo de la anulación para mantener trazabilidad histórica.

---

## 5. Verificación Pública

Cualquier tercero (como un empleador) puede consultar el contrato de manera gratuita y pública sin iniciar sesión:

* **[isValid](file:///home/tomas/workspace/diplomatura-blockchain/dApps/tp-final/unlu-cert-token/src/AcademicCredentials.sol#L168-L170)**: Retorna un booleano indicando si la credencial existe y está activa.
* **[verify](file:///home/tomas/workspace/diplomatura-blockchain/dApps/tp-final/unlu-cert-token/src/AcademicCredentials.sol#L175-L179)**: Retorna la credencial completa (`Credential`) y su validez, permitiendo al frontend cotejar los hashes y datos off-chain.
