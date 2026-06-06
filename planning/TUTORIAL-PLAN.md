# 🚀 Tutorial: Construcción del Proyecto "Credenciales Académicas UNLu"

Este documento es una guía paso a paso y detallada para construir el proyecto final de la diplomatura. Está pensado para seguirse de principio a fin, adoptando una arquitectura de **Monorepo** donde el código del contrato inteligente y el de la aplicación web conviven armónicamente.

---

## 🛠 Fase 1: Preparación del Entorno (Monorepo)

Un monorepo nos permite manejar el backend (blockchain) y el frontend en un solo lugar, simplificando el control de versiones.

### Paso 1.1: Inicialización del Repositorio
Primero, vamos a crear la estructura principal. Abrí tu terminal y ejecutá:

```bash
# Crea la carpeta principal del proyecto y entra en ella
mkdir unlu-credenciales-blockchain
cd unlu-credenciales-blockchain

# Inicializa un repositorio de Git vacío
git init
```

### Paso 1.2: Inicializar el entorno Blockchain (Foundry)
Vamos a usar Foundry para desarrollar nuestros Smart Contracts. Lo instalaremos en una subcarpeta llamada `blockchain`.

```bash
# Inicializa un nuevo proyecto de Foundry en la carpeta 'blockchain'
forge init blockchain
```
*Tip: Esto creará directorios como `src`, `test` y `script` dentro de la carpeta `blockchain`.*

### Paso 1.3: Clonar e Integrar el Frontend Starter
Para el frontend, usaremos un template base de Next.js proveído por la cátedra. Lo clonaremos en la carpeta `frontend`, pero borraremos su historial de Git para que sea parte de nuestro monorepo principal.

```bash
# Asegurate de estar en la raíz del proyecto (unlu-credenciales-blockchain)
# Clona el repositorio starter en la carpeta 'frontend'
git clone https://github.com/dpetrocelli/diplo-unq-blockchain-tp-final-starter frontend

# Elimina el historial de git del starter
rm -rf frontend/.git
```

### Paso 1.4: Configuración de Git
Es crucial evitar subir archivos pesados o sensibles (como claves privadas) a GitHub.

Crea un archivo llamado `.gitignore` en la **raíz del proyecto** (`unlu-credenciales-blockchain/.gitignore`) y agregá lo siguiente:

```text
# Node
node_modules/
frontend/.next/

# Foundry
blockchain/out/
blockchain/cache/
blockchain/broadcast/

# Entorno y variables sensibles
.env
```

Finalmente, hacemos el primer commit estructural:
```bash
git add .
git commit -m "chore: inicialización del monorepo (foundry + frontend starter)"
```

---

## ⛓ Fase 2: Desarrollo del Smart Contract

Vamos a trabajar exclusivamente en la carpeta `blockchain`.

### Paso 2.1: Instalar Dependencias (OpenZeppelin)
Usaremos los estándares seguros de OpenZeppelin para nuestro token.

```bash
cd blockchain
# Instala la librería de contratos de OpenZeppelin
forge install openzeppelin/openzeppelin-contracts --no-commit
```

### Paso 2.2: Escribir el Contrato Inteligente
Creá o modificá el archivo `blockchain/src/AcademicCredentials.sol`. Aquí está la guía de implementación:

1. **Importaciones**: Necesitás heredar de `AccessControl` (para manejar roles) y de `ERC721URIStorage` (para manejar el NFT y su metadata).
2. **Estructura de Datos**: Definí un `struct Credential` que contenga:
   - `degreeName` (string): Nombre del título (ej. "Licenciatura en Sistemas").
   - `studentNameHash` (bytes32): `keccak256` del nombre completo + DNI para privacidad.
   - `issueDate` (uint256): Timestamp de emisión.
   - `documentHash` (bytes32): `keccak256` del archivo PDF original del título.
   - `active` (bool): `true` por defecto, `false` si la credencial fue revocada.
3. **Almacenamiento**: Creá un `mapping(uint256 => Credential) public credentials;` para guardar la data on-chain.
4. **Soulbound (Intransferible)**: Sobrescribí la función `_update` de ERC721. Si el emisor (`from`) no es la dirección cero (es decir, no es un minteo) y el receptor (`to`) tampoco, debe hacer `revert("Soulbound: non-transferable");`.
5. **Roles**: Definí un `ISSUER_ROLE` y usá `DEFAULT_ADMIN_ROLE` para el rector de la universidad.
6. **Funciones Obligatorias**:
   - `grantIssuer(address account)`: Administrador otorga el rol de emisor a una cuenta. Debe emitir el evento `IssuerGranted(account, msg.sender)`.
   - `revokeIssuer(address account)`: Administrador revoca el rol de emisor de una cuenta. Debe emitir el evento `IssuerRevoked(account, msg.sender)`.
   - `issueCredential(address student, uint256 tokenId, string degreeName, bytes32 studentNameHash, bytes32 documentHash, string metadataURI)`: Emisor emite la credencial, guarda los datos en el mapping y emite `CredentialIssued(student, tokenId, degreeName, studentNameHash)`.
   - `revoke(uint256 tokenId, string reason)`: Emisor marca la credencial como inactiva (`active = false`), quema el token con `_burn(tokenId)` y emite `CredentialRevoked(tokenId, msg.sender, reason)`.
   - `verify(uint256 tokenId) public view returns (Credential memory, bool isValid)`: Cualquiera puede verificar un tokenId, retornando la estructura de la credencial y si es actualmente válida (existe y está activa).

### Paso 2.3: Documentación Inicial
Regresá a la raíz del proyecto y creá un `README.md`.
- Redactá una introducción sobre qué hace el proyecto.
- Agregá un diagrama usando Mermaid ( ```mermaid ``` ) que muestre cómo un emisor carga los datos (con hashes correspondientes para privacidad), el contrato los guarda y un verificador consulta a través de `verify()`.

---

## 🧪 Fase 3: Pruebas y Seguridad

No desplegamos sin probar. Seguimos en la carpeta `blockchain`.

### Paso 3.1: Pruebas Unitarias (Tests)
Abrí `blockchain/test/AcademicCredentials.t.sol` y estructurá tus pruebas para cubrir los siguientes 10 escenarios obligatorios:

**Camino Feliz:**
1. **Asignación de Issuer**: Admin agrega un emisor con `grantIssuer(address)` y se verifica usando `hasRole(ISSUER_ROLE, addr)`.
2. **Emisión de Credencial**: Issuer emite una credencial y valida que todos los campos del struct `Credential` se guarden correctamente.
3. **Verificación de Credencial**: `verify()` devuelve los datos correctos del struct y `isValid = true`.
4. **Revocación de Credencial**: Issuer revoca una credencial con `revoke(tokenId, reason)` y `verify()` devuelve `isValid = false`.

**Casos de Error:**
5. **Emisión no autorizada**: Una dirección sin `ISSUER_ROLE` intenta emitir y la transacción revierte.
6. **Soulbound (Intransferibilidad)**: Intentar transferir una credencial entre dos direcciones revierte.
7. **TokenID duplicado**: Intentar emitir una credencial con un `tokenId` que ya fue emitido revierte.
8. **Revocación inexistente**: Intentar revocar un `tokenId` inexistente revierte.
9. **Administración no autorizada**: Una dirección sin `DEFAULT_ADMIN_ROLE` intenta agregar emisores y la transacción revierte.

**Fuzzing:**
10. **Fuzz de Emisión**: `testFuzz_Emision(address estudiante, uint256 tokenId)` para verificar que `ownerOf(tokenId) == estudiante` para cualquier `estudiante != address(0)`.

Para correr las pruebas y ver la cobertura:
```bash
forge test
forge coverage --report lcov
```
*(Meta: Lograr +80% de cobertura)*

### Paso 3.2: Análisis de Seguridad con Slither
Asegurate de tener Python instalado y ejecutá:
```bash
pip install slither-analyzer
slither .
```
Creá un archivo `SECURITY.md` en la raíz del proyecto, copiá las advertencias que tire Slither (si las hay) y escribí una breve mitigación o justificación.

---

## 🚀 Fase 4: Despliegue en L2 (Base Sepolia)

### Paso 4.1: Configuración de Entorno
Dentro de la carpeta `blockchain`, creá un archivo `.env` (¡Asegurate de que no se suba a Git!).

```env
PRIVATE_KEY=tu_clave_privada_de_metamask_de_pruebas
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
BASESCAN_API_KEY=tu_api_key_de_basescan
```

### Paso 4.2: Script de Despliegue
En `blockchain/script/Deploy.s.sol`, escribí un script básico de Foundry que haga `vm.startBroadcast(vm.envUint("PRIVATE_KEY"));`, despliegue el contrato `AcademicCredentials`, y termine con `vm.stopBroadcast()`.

### Paso 4.3: Ejecutar el Deploy y Verificar
```bash
# Carga las variables de entorno
source .env

# Ejecuta el script, envía la transacción y verifica el contrato en Basescan
forge script script/Deploy.s.sol --rpc-url $BASE_SEPOLIA_RPC_URL --private-key $PRIVATE_KEY --broadcast --verify --etherscan-api-key $BASESCAN_API_KEY
```

**¡Guarda la dirección del contrato que te devuelve la terminal!**
Como paso extra, andá a Basescan, conectá tu billetera y emití 3 credenciales de prueba usando la interfaz de "Write Contract".

---

## 💻 Fase 5: Conexión del Frontend

Es hora de darle una interfaz visual. Nos movemos a la carpeta `frontend`.

### Paso 5.1: Instalación
```bash
cd ../frontend
npm install
```

### Paso 5.2: Conectar el Contrato
1. **ABI**: Copiá el archivo `AcademicCredentials.json` generado en `blockchain/out/AcademicCredentials.sol/` y pegalo en el frontend (ej. en `src/abi/`).
2. **Dirección**: Encontrá el archivo de constantes del starter (ej. `constants.ts`) y actualizá la variable `CREDENTIALS_ADDRESS` con la dirección que guardaste en el paso 4.3.

### Paso 5.3: Configurar Wagmi
En el archivo `wagmi.ts`, asegurate de que la cadena importada y utilizada sea `baseSepolia`.

### Paso 5.4: Interfaz Pública (Verificación)
Modificá el componente de lectura. Usá el hook `useReadContract` de Wagmi.
Pasale la dirección, el ABI, el nombre de la función (`verify`) y el `args` (el ID a buscar).
Mostrá en pantalla los datos devueltos (Nombre del título, fecha de emisión, dirección del estudiante y `documentHash`). Si la credencial existe y está activa (`isValid == true`), mostrá un ✅. Si no existe o fue revocada, mostrá ❌.

### Paso 5.5: Interfaz del Emisor (Escritura)
En el panel de emisor, vinculá el formulario.
Antes de enviar la transacción a la blockchain, asegurate de hashear los datos de privacidad en el frontend usando utilidades de Viem como `keccak256` y `encodePacked` (o `stringToBytes` / `StringToBytes` + `keccak256`):
- Generá `studentNameHash` haciendo `keccak256(encodePacked(nombreCompleto, DNI))`.
- Generá `documentHash` haciendo `keccak256` sobre el contenido o representación del documento/analítico.
Enviá estos hashes junto con el `degreeName`, `student` address, `tokenId` y el `metadataURI` a la función `issueCredential` usando `useWriteContract`.
También vinculá el formulario de revocación para llamar a `revoke(tokenId, reason)`.

---

## 🎬 Fase 6: Finalización y Demo

1. Levantá el proyecto localmente:
   ```bash
   npm run dev
   ```
2. Probá el flujo completo: conectá tu billetera, emití una credencial como Issuer, y luego buscala en la vista pública.
3. Grabá un video corto (máximo 5 min) mostrando el funcionamiento.
4. Subí el video y agregá el enlace al final de tu `README.md`.

---

## 🌟 Opcionales: "El Tablero de Extras"

Si llegaste hasta acá, podés ir por más puntos creando nuevas ramas (`git checkout -b feature/lo-que-sea`):

1. **Deploy en Vercel**: Importá la carpeta `frontend` en Vercel. ¡Tendrás una URL pública real!
2. **Super-Admin UI**: Creá una ruta `/admin` en Next.js donde, usando `useWriteContract`, puedas asignar o revocar el rol de `ISSUER_ROLE` a otras direcciones.
3. **Código QR**: Usá `react-qr-code` en la vista de verificación. Que el QR apunte a `https://tu-app.vercel.app/verify/{ID}`.
4. **Integración IPFS (Pinata)**: Creá una API en Next.js que reciba un PDF, lo suba a Pinata, devuelva el CID, y lo guardes como el `tokenURI` al momento de emitir la credencial en la blockchain.

¡Muchos éxitos en la implementación!
