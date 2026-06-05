## 📋 Planificación 1: El Camino Crítico (Versión Aprobable)

### Fase 1: Inicialización del Repositorio Único (Monorepo)

El objetivo es tener una estructura limpia donde convivan el contrato y el frontend.

* **Paso 1.1:** Creá una carpeta vacía para tu proyecto final (ej. `unlu-credenciales-blockchain`) e inicializá Git:
```bash
mkdir unlu-credenciales-blockchain && cd unlu-credenciales-blockchain
git init

```


* **Paso 1.2:** Inicializá el backend con **Foundry** dentro de una subcarpeta llamada `blockchain`:
```bash
forge init blockchain

```


* **Paso 1.3:** En la raíz del proyecto (fuera de `blockchain`), cloná el frontend *starter*, pero **vaciando su historial de Git** para que se integre a tu repo principal:
```bash
git clone https://github.com/dpetrocelli/diplo-unq-blockchain-tp-final-starter frontend
rm -rf frontend/.git

```


* **Paso 1.4:** Creá un archivo `.gitignore` en la raíz que ignore `node_modules`, `.env`, y las carpetas de compilación de Foundry (`out`, `cache`). Hacé tu primer `git commit`.

---

### Fase 2: Smart Contract y Datos Base

Trabajaremos dentro de la carpeta `blockchain`.

* **Paso 2.1 (Parte 1 - Solidity):** Instalá OpenZeppelin Contracts mediante Forge:
```bash
cd blockchain
forge install openzeppelin/openzeppelin-contracts

```


* **Paso 2.2:** Creá `blockchain/src/AcademicCredentials.sol`. Copiá tu esqueleto de la clase 3 y realizá las modificaciones operativas:
* Importá `AccessControl` y `ERC721URIStorage`.
* Definí el `struct Credential` con sus 5 campos exactos y el mapping `mapping(uint256 => Credential) public credentials`.
* Escribí el *override* de la función `_update` con el `revert("Soulbound: non-transferable")` para bloquear transferencias.
* Implementá los modificadores de rol en `issueCredential` (`onlyRole(ISSUER_ROLE)`) y en la gestión de issuers (`onlyRole(DEFAULT_ADMIN_ROLE)`).


* **Paso 2.3 (Parte 0 - Documentación):** Creá el `README.md` en la **raíz del proyecto**. Escribí los párrafos de contexto institucional (sección 0.1). Para la sección 0.2, podés escribir un diagrama de bloques usando sintaxis nativa de **Mermaid** dentro del Markdown, detallando cómo viaja el dato desde el formulario web hasta el almacenamiento del struct en Base Sepolia.

---

### Fase 3: Testing y Seguridad Básica

Asegurar que la lógica no falle antes de gastar gas de testnet.

* **Paso 3.1 (Parte 2 - Pruebas unitarias):** En `blockchain/test/AcademicCredentials.t.sol`:
* Escribí el `setUp()` configurando un `admin` y un `issuer` usando `vm.prank`.
* Escribí un test para el "camino feliz": emitir una credencial y usar `assertEq` para validar que los campos del struct coincidan.
* Escribí el test de error crítico: usá `vm.expectRevert` antes de intentar un `transferFrom` entre dos direcciones aleatorias para verificar el comportamiento *soulbound*.
* Escribí un test de fuzzing básico: `testFuzz_Emision(address estudiante, uint256 id)` asegurando que el *owner* final sea el estudiante si la dirección es válida.
* Corré `forge coverage --report lcov` y verificá superar el 80%.


* **Paso 3.2 (Parte 3 - Seguridad):** Si usás Linux/macOS, instalá Slither de forma local (`pip install slither-analyzer`) y ejecutá `slither .` dentro de `blockchain`. Creá `SECURITY.md` en la raíz, volcá los resultados en formato tabla y redactá las respuestas del "Análisis Propio" sobre la gestión de riesgos (pérdida de llaves, ataques de diccionario al hash, etc.).

---

### Fase 4: Despliegue (Deploy) en L2

Momento de subir el contrato a la red de pruebas.

* **Paso 4.1:** Creá un archivo `blockchain/.env` (asegurate de que esté en el `.gitignore`) con tus credenciales:
```env
PRIVATE_KEY=tu_clave_privada_de_metamask_de_pruebas
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
BASESCAN_API_KEY=tu_api_key_de_basescan

```


* **Paso 4.2:** Escribí un script de despliegue en `blockchain/script/Deploy.s.sol` que asigne el rol de administrador a tu propia wallet.
* **Paso 4.3:** Ejecutá el deploy y la verificación automática en Basescan en un solo comando:
```bash
source .env
forge script script/Deploy.s.sol --rpc-url $BASE_SEPOLIA_RPC_URL --private-key $PRIVATE_KEY --broadcast --verify --etherscan-api-key $BASESCAN_API_KEY

```


* **Paso 4.4:** Guardá la dirección del contrato generado y usá la interfaz web de Basescan para emitir manualmente **3 credenciales ficticias** con IDs `1`, `2` y `3` para tener datos listos.

---

### Fase 5: Conexión del Frontend (Next.js)

Trabajaremos dentro de la carpeta `frontend`.

* **Paso 5.1:** Instalá las dependencias del starter:
```bash
cd ../frontend
npm install

```


* **Paso 5.2:** Buscá el archivo de configuración de contratos (suele llamarse `constants.ts` o estar dentro de `src/wagmi.ts` o similar en el starter). Actualizá la variable `CREDENTIALS_ADDRESS` con la dirección de tu contrato desplegado y pegá el **ABI** generado por Foundry (lo encontrás en `blockchain/out/AcademicCredentials.sol/AcademicCredentials.json`).
* **Paso 5.3:** Configurá la red en `wagmi.ts` para que apunte estrictamente a `baseSepolia`.
* **Paso 5.4:** Modificá el componente de la vista pública: implementá el hook `useReadContract` de wagmi para llamar a `verify(tokenId)`. Mapeá el resultado en pantalla (si `active` es true muestra ✅, si es false o revocado muestra ❌).
* **Paso 5.5:** Modificá la vista de Issuer: vinculá el botón de "Emitir" para que primero calcule el `keccak256` del Nombre + DNI ingresados usando la librería `viem` (`keccak256(stringToBytes(nombre + dni))`) y luego invoque a `useWriteContract` enviando ese hash on-chain.

---

### Fase 6: Demo

* **Paso 6.1:** Levantá el proyecto local (`npm run dev`). Abrí OBS Studio o cualquier grabador de pantalla y ejecutá el flujo completo de la rúbrica en menos de 5 minutos. Subilo a Drive o YouTube como oculto y pegá el link al final del `README.md`.

---

## 🚀 Planificación 2: El Tablero de "Extras" (Operativo)

Si el camino crítico está listo y te queda tiempo, ejecutá estas tareas de forma aislada e incremental en ramas de Git separadas (`git checkout -b feature/extra-X`):

1. **Despliegue en Vercel (Complejidad: Muy Baja | Recompensa: Alta):**
* Instalá la CLI de Vercel (`npm i -g vercel`) o vinculá tu repositorio directamente en el panel web de vercel.com.
* *Ojo:* Configurá el "Root Directory" del proyecto apuntando específicamente a la carpeta `frontend` en el panel de Vercel. Desplegá. Si funciona, la URL pública reemplaza la necesidad obligatoria del video.


2. **Modo Super-Admin en UI (Complejidad: Baja | Recompensa: +5 Puntos Bonus):**
* En el frontend, creá una pestaña o ruta `/admin` protegida visualmente.
* Implementá dos inputs de tipo texto para ingresar una dirección de wallet, conectados a los métodos `useWriteContract` de las funciones `grantIssuer(address)` y `revokeIssuer(address)`.


3. **Código QR de Verificación (Complejidad: Media-Baja | Recompensa: +10 Puntos Bonus):**
* Instalá una librería ligera en el frontend: `npm install react-qr-code`.
* En la vista de resultados del buscador público, renderizá el componente pasándole la URL dinámica:
```jsx
<QRCode value={`https://tu-app.vercel.app/verify/${tokenId}`} />

```




4. **Carga e Integración real con IPFS via Pinata (Complejidad: Media | Recompensa: +5 Puntos Bonus):**
* Creá una cuenta gratuita en Pinata y generá un *JWT Token*.
* En `frontend`, crea una API Route en Next.js (`frontend/src/app/api/ipfs/route.ts`) para no exponer tus llaves privadas en el navegador. Esta API recibirá el archivo PDF y lo enviará a Pinata usando `FormData`.
* En el formulario de emisión del Issuer, añadí un `<input type="file" accept=".pdf" />`. Al procesar, primero llamá a tu API interna, obtené el CID (hash de IPFS) y pasáselo a la función de Solidity como el `metadataURI`.
