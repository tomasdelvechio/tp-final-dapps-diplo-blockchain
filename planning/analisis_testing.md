# Análisis de Testing - Credenciales Académicas UNLu

Este documento contiene el mapeo detallado entre los **10 tests obligatorios** descriptos en la *Parte 2 — Testing* del enunciado del [Trabajo Final](file:///home/tomas/workspace/diplomatura-blockchain/dApps/tp-final/planning/Trabajo%20Final%20%E2%80%94%20Verificaci%C3%B3n%20de%20credenciales%20acad%C3%A9micas%20UNQ%20%E2%80%94%20UNQ%20Diplo%20Blockchain.html) y su correspondiente implementación en el archivo de pruebas [AcademicCredentials.t.sol](file:///home/tomas/workspace/diplomatura-blockchain/dApps/tp-final/unlu-cert-token/test/AcademicCredentials.t.sol).

---

## 📋 Mapeo de Tests Obligatorios

### 🟢 Camino Feliz

#### 1. Admin agrega un issuer y se verifica con `hasRole(ISSUER_ROLE, addr)`
* **Función:** [test_AdminCanGrantAndRevokeIssuer](file:///home/tomas/workspace/diplomatura-blockchain/dApps/tp-final/unlu-cert-token/test/AcademicCredentials.t.sol#L43-L54) (Líneas 43-54)
* **Descripción:** Comprueba que inicialmente una dirección no posea el rol de emisor (`ISSUER_ROLE`), luego el administrador le otorga el rol y se valida con `hasRole`, y por último se revoca dicho rol verificando que el cambio sea persistido.

#### 2. Issuer emite una credencial y todos los campos se guardan
* **Función:** [test_IssuerCanIssue](file:///home/tomas/workspace/diplomatura-blockchain/dApps/tp-final/unlu-cert-token/test/AcademicCredentials.t.sol#L59-L90) (Líneas 59-90)
* **Descripción:** Realiza la emisión de una credencial firmada con `vm.prank(issuer)` y valida que el propietario, el balance, la URI del token, el estado de validez y todos los atributos internos de la estructura `Credential` (como el hash del nombre del estudiante y el hash del documento) se almacenen y correspondan exactamente con los parámetros provistos.

#### 3. `verify()` devuelve los datos correctos
* **Función:** [test_VerifyReturnsCorrectData](file:///home/tomas/workspace/diplomatura-blockchain/dApps/tp-final/unlu-cert-token/test/AcademicCredentials.t.sol#L95-L115) (Líneas 95-115)
* **Descripción:** Emite una credencial y luego invoca al método de lectura pública `verify(tokenId)`. Confirma que el struct devuelto por el contrato y el flag de validez `isValid` posean los datos adecuados.

#### 4. Issuer revoca y `verify()` devuelve `isValid = false`
* **Función:** [test_IssuerCanRevoke](file:///home/tomas/workspace/diplomatura-blockchain/dApps/tp-final/unlu-cert-token/test/AcademicCredentials.t.sol#L120-L146) (Líneas 120-146)
* **Descripción:** Registra una credencial activa, la revoca mediante `revoke` y valida que el flag general `isValid(tokenId)` pase a ser falso. Además, dado que el token es quemado, la consulta del dueño (`ownerOf`) debe revertir, y al llamar a `verify` el struct devuelto debe reflejar `active = false` e `isValid = false`.

---

### 🔴 Casos de Error

#### 5. Una address sin `ISSUER_ROLE` no puede emitir (revierte)
* **Función:** [test_NonIssuerCannotIssue](file:///home/tomas/workspace/diplomatura-blockchain/dApps/tp-final/unlu-cert-token/test/AcademicCredentials.t.sol#L151-L162) (Líneas 151-162)
* **Descripción:** Simula la llamada desde un usuario no autorizado (Alice) intentando invocar a `issueCredential` y verifica que el contrato aborte la transacción (`vm.expectRevert`).

#### 6. Transferir una credencial entre dos addresses revierte (soulbound)
* **Función:** [test_CannotTransfer](file:///home/tomas/workspace/diplomatura-blockchain/dApps/tp-final/unlu-cert-token/test/AcademicCredentials.t.sol#L167-L183) (Líneas 167-183)
* **Descripción:** Comprueba la característica Soulbound. Tras la emisión de una credencial para un estudiante (Alice), se intenta transferir el token a otra cuenta (Bob) usando `transferFrom`, y se valida que la llamada revierta con el mensaje `"Soulbound: non-transferable"`.

#### 7. Emitir con `tokenId` duplicado revierte
* **Función:** [test_CannotIssueDuplicateTokenId](file:///home/tomas/workspace/diplomatura-blockchain/dApps/tp-final/unlu-cert-token/test/AcademicCredentials.t.sol#L188-L211) (Líneas 188-211)
* **Descripción:** Registra una credencial con un `tokenId` determinado (por ejemplo, 1). Luego, bajo el mismo emisor, intenta emitir otra credencial reutilizando el mismo `tokenId = 1` a un estudiante distinto, asegurando que la transacción falle de forma controlada.

#### 8. Revocar un `tokenId` inexistente revierte
* **Función:** [test_CannotRevokeNonExistent](file:///home/tomas/workspace/diplomatura-blockchain/dApps/tp-final/unlu-cert-token/test/AcademicCredentials.t.sol#L216-L222) (Líneas 216-222)
* **Descripción:** Se intenta realizar la revocación sobre un identificador que no ha sido acuñado previamente y se verifica la reversión con la traza `"AcademicCredentials: token does not exist"`.

#### 9. Una address sin `DEFAULT_ADMIN_ROLE` no puede agregar issuers
* **Función:** [test_NonAdminCannotManageIssuers](file:///home/tomas/workspace/diplomatura-blockchain/dApps/tp-final/unlu-cert-token/test/AcademicCredentials.t.sol#L227-L237) (Líneas 227-237)
* **Descripción:** Simula las acciones de un usuario común (Alice) intentando conceder (`grantIssuer`) o retirar (`revokeIssuer`) permisos de emisión a otras cuentas, y confirma que ambos intentos revierten por falta de privilegios administrativos.

---

### ⚡ Fuzz

#### 10. `fuzz_issueCredential(address student, uint256 tokenId)` — verificar que `ownerOf(tokenId) == student` para cualquier `student != address(0)`
* **Función:** [testFuzz_IssueToAnyAddress](file:///home/tomas/workspace/diplomatura-blockchain/dApps/tp-final/unlu-cert-token/test/AcademicCredentials.t.sol#L242-L259) (Líneas 242-259)
* **Descripción:** Utiliza fuzzing nativo de Foundry para asegurar que ante cualquier valor arbitrario generado para la dirección del estudiante (excluyendo la dirección cero) y el ID del token, el contrato asocie el dominio correcto del token y que este sea considerado como válido.

---

## 🔍 Pruebas Adicionales Identificadas

El contrato de pruebas también incluye dos tests complementarios para comprobar el estado inicial tras el despliegue del contrato inteligente:
1. [test_NameAndSymbol](file:///home/tomas/workspace/diplomatura-blockchain/dApps/tp-final/unlu-cert-token/test/AcademicCredentials.t.sol#L30-L33) (Líneas 30-33): Comprueba que el nombre sea `"UNLu Academic Credential"` y su símbolo sea `"UNLu-CRED"`.
2. [test_DeployerHasRoles](file:///home/tomas/workspace/diplomatura-blockchain/dApps/tp-final/unlu-cert-token/test/AcademicCredentials.t.sol#L35-L38) (Líneas 35-38): Comprueba que el deployer herede inmediatamente los roles de administración (`DEFAULT_ADMIN_ROLE`) y emisión (`ISSUER_ROLE`).
