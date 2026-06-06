# Auditoría de Seguridad y Reporte de Slither (TP Final)

Este documento resume los resultados del análisis estático realizado con la herramienta **Slither** sobre los contratos inteligentes del proyecto de Credenciales Académicas de la Universidad Nacional de Luján (UNLu), ubicado en el directorio `unlu-cert-token`.

## 📊 Resumen Ejecutivo del Análisis

- **Contratos Analizados:** 22 contratos (incluyendo dependencias de OpenZeppelin).
- **Detectores Ejecutados:** 101 detectores de vulnerabilidades.
- **Hallazgos Totales:** 47 resultados.
- **Nivel de Riesgo General:** **Bajo**. No se encontraron vulnerabilidades críticas, de severidad alta ni media en el contrato principal `AcademicCredentials.sol`. La gran mayoría de los reportes corresponden a falsos positivos en bibliotecas externas de OpenZeppelin o advertencias informativas/de optimización.

---

## 🔍 Detalle de Hallazgos, Mitigaciones y Justificaciones

A continuación se detallan los hallazgos más relevantes reportados por Slither en `unlu-cert-token/docs/slither-output.txt`, ordenados por tipo de detector:

### 1. Uso de Timestamp (`timestamp`)
*   **Ubicación:** `AcademicCredentials.verify(uint256)` (en [AcademicCredentials.sol:L175-179](file:///home/tomas/workspace/diplomatura-blockchain/dApps/tp-final/unlu-cert-token/src/AcademicCredentials.sol#L175-L179)).
*   **Reporte de Slither:** Advierte sobre el uso y manipulación de variables relacionadas con marcas de tiempo (timestamp) en comparaciones peligrosas:
    ```solidity
    valid = _ownerOf(tokenId) != address(0) && cred.active
    ```
*   **Justificación / Falso Positivo:**
    *   **Falso Positivo de Slither:** La función `verify` no realiza ninguna comparación directa del timestamp de la block.timestamp. Slither genera esta advertencia porque la estructura `Credential` leída de almacenamiento contiene un campo `issueDate` que fue inicializado con `block.timestamp` durante la acuñación del token.
    *   **Uso del Timestamp:** El único uso de `block.timestamp` en el contrato es al emitir la credencial (`issueCredential`), donde se registra de forma informativa e histórica la fecha y hora de emisión (`issueDate = block.timestamp`).
    *   **Seguridad:** El contrato no utiliza marcas de tiempo para tomar decisiones críticas de lógica del negocio (como bloquear fondos, sorteos aleatorios o condiciones de tiempo de custodia). Por lo tanto, no existe riesgo de manipulación de marcas de tiempo por parte de los mineros/validadores (vulnerabilidad conocida como *Block Timestamp Manipulation*).

### 2. Exponenciación Incorrecta (`incorrect-exp`)
*   **Ubicación:** `Math.mulDiv(uint256,uint256,uint256)` (en la dependencia `lib/openzeppelin-contracts/contracts/utils/math/Math.sol`).
*   **Reporte de Slither:** Indica que se utiliza el operador XOR a nivel de bits (`^`) en lugar del operador de exponenciación (`**`):
    ```solidity
    inverse = (3 * denominator) ^ 2
    ```
*   **Justificación:**
    *   Este hallazgo es un **falso positivo conocido** de Slither al analizar la biblioteca matemática de OpenZeppelin.
    *   El operador `^` es totalmente intencional y correcto en este contexto. Se trata de un algoritmo de optimización de cálculo de inversas modulares utilizando Hensel's lemma y aproximaciones de Newton-Raphson, donde la operación XOR se emplea como parte del paso de inicialización de la iteración. No representa un error tipográfico de exponenciación.

### 3. División antes de Multiplicación (`divide-before-multiply`)
*   **Ubicación:** Funciones `Math.mulDiv` y `Math.invMod` (en la dependencia `lib/openzeppelin-contracts/contracts/utils/math/Math.sol`).
*   **Reporte de Slither:** Advierte sobre operaciones de multiplicación realizadas sobre resultados de divisiones previas, lo que podría ocasionar pérdida de precisión en aritmética entera.
*   **Justificación:**
    *   Este hallazgo se encuentra encapsulado dentro de la librería matemática de OpenZeppelin, la cual cuenta con múltiples auditorías formales y pruebas exhaustivas.
    *   El orden de las operaciones en estas funciones específicas está diseñado minuciosamente para implementar algoritmos numéricos avanzados (como el algoritmo de Euclides extendido y divisiones de precisión de 512 bits) sin desbordar los límites de almacenamiento de la EVM de manera segura. No hay riesgo de pérdida de precisión no controlada en nuestro flujo de negocio.

### 4. Uso de Assembly Inline (`assembly`)
*   **Ubicación:** Varias librerías de OpenZeppelin, incluyendo `ERC721Utils.sol`, `Bytes.sol`, `Panic.sol`, `Strings.sol` y `Math.sol`.
*   **Reporte de Slither:** Identifica el uso de bloques `assembly` dentro del código, advirtiendo sobre posibles riesgos de bypass de seguridad, legibilidad o errores de memoria.
*   **Justificación / Mitigación:**
    *   El uso de assembly está estrictamente contenido en el código de librerías oficiales de OpenZeppelin para lograr optimizaciones de gas críticas en la manipulación de strings, bytes y verificación de llamadas a interfaces.
    *   En nuestro contrato `AcademicCredentials.sol` **no se utiliza assembly personalizado**, asegurando que toda la lógica de negocio esté escrita en Solidity estructurado de alto nivel y protegida por las salvaguardas estándar del compilador.

### 5. Advertencias del Compilador y Pragma (`solc-version` y `pragma`)
*   **Ubicación:** Declaraciones `pragma solidity` a lo largo de todos los contratos.
*   **Reporte de Slither:** 
    1.  Se detectaron 6 versiones de Solidity diferentes en el árbol de dependencias (`^0.8.20`, `^0.8.24`, `>=0.8.4`, etc.).
    2.  El constraint `^0.8.20` utilizado por `AcademicCredentials.sol` tiene vulnerabilidades asociadas conocidas en el compilador de Solidity (por ejemplo, optimizaciones del inliner y re-codificaciones ABI).
*   **Mitigación:**
    *   **Mismatch de Pragma:** La divergencia en los constraints de pragma es normal cuando se importan paquetes externos de OpenZeppelin, ya que estas librerías definen compatibilidades amplias (p. ej., `>=0.8.0`).
    *   **Versión de Solc de Despliegue:** Para mitigar problemas en las versiones del compilador:
        1.  En la configuración de Foundry, se compilará y desplegará utilizando una versión fija, estable y reciente de Solidity (por ejemplo, `0.8.24` o posterior), la cual corrige los problemas detectados en las versiones `0.8.20` iniciales.
        2.  Dado que el despliegue es en **Base Sepolia** (un Layer 2 compatible con EVM), configuraremos el target de EVM adecuado (`paris` o `shanghai` en lugar de `cancun` si se despliega en redes L2 que aún no soportan completamente los últimos opcodes como `PUSH0`), garantizando la compatibilidad del bytecode generado.

### 6. Exceso de Dígitos en Literales (`too-many-digits`)
*   **Ubicación:** Funciones de manipulación de bytes y bits en `Bytes.sol` y `Math.sol` de OpenZeppelin.
*   **Reporte de Slither:** Advierte del uso de constantes hexadecimales con un número elevado de dígitos sin separadores visuales (p. ej., `0x0000000000000000ffffffffffffffff0000000000000000ffffffffffffffff`).
*   **Justificación:**
    *   Son máscaras de bits necesarias para la manipulación y alineación a bajo nivel de strings y bytes. Dado que pertenecen a librerías auditadas y su valor constante es correcto para la representación binaria deseada, no representa ningún riesgo de seguridad.

---

## 🛡️ Medidas de Seguridad Adicionales Implementadas

Adicionalmente a la resolución/justificación de los hallazgos de Slither, el contrato `AcademicCredentials.sol` ha implementado las siguientes defensas robustas:

1.  **Soulbound Tokens (No Transferibles):**
    El método `_update` está sobreescrito para asegurar que cualquier intento de transferencia entre cuentas distintas de `address(0)` (emisión y revocación) sea revertido inmediatamente con el mensaje `"Soulbound: non-transferable"`.
2.  **Control de Acceso Basado en Roles (RBAC):**
    Se utiliza `AccessControl` de OpenZeppelin. Únicamente las cuentas con `DEFAULT_ADMIN_ROLE` pueden administrar (otorgar o revocar) el rol de emisor (`ISSUER_ROLE`). Y únicamente las cuentas con `ISSUER_ROLE` pueden ejecutar `issueCredential` y `revoke`.
3.  **Privacidad de Datos:**
    Para proteger los datos personales de los estudiantes en la blockchain pública, el nombre y DNI del estudiante se almacenan en forma de hash (`studentNameHash = keccak256(...)`), impidiendo la exposición directa de información de identificación personal (PII) on-chain.
4.  **Validaciones de Entrada (Check-Effects-Interactions):**
    Cada función externa contiene validaciones estrictas (`require`) para evitar direcciones nulas (`address(0)`), strings vacíos o identificadores incorrectos.
