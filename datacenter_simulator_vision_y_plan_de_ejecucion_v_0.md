# Datacenter Simulator — Visión y Plan de Ejecución (v0.1)

> Juego web **multijugador** y **data‑driven** (más lógica que gráficos), con frontend y backend en JavaScript/TypeScript. Enfocado en simulación realista de operación de datacenters, economía de servicios y competidores.

---

## 1) Documento de Ideas (Visión + Diseño)

### 1.1 Objetivo del juego
Construir, operar y escalar un datacenter rentable. Los jugadores adquieren hardware, diseñan redes y ofertan servicios a otros jugadores/NPCs. Pueden optar por estrategias lícitas o ilícitas **dentro del juego** (estrictamente simulado), afectando reputación, ingresos y riesgos.

### 1.2 Público objetivo
- Amantes de simuladores/tycoons.
- Perfis técnicos (devs/devops/netops) que disfrutan de sistemas, redes, y economía.
- Jugadores que prefieren progreso persistente y PvP indirecto (mercado, latencia, reputación) con PvP directo limitado/simulado (p.ej., ataques DDoS ficticios, firewalls y mitigación).

### 1.3 Núcleo jugable (game loop)
1. **Planificar**: presupuesto, energía, racks, red, seguridad, SLA.
2. **Invertir**: comprar/arrendar servidores, ancho de banda, firewalls, licencias, mitigación DDoS, etc.
3. **Configurar**: topología (VLANs, BGP simulado, LB, WAF), clústeres de k8s (nivel abstracto), reglas.
4. **Vender/Ofertar**: hosting de sitios/servicios, housing/colocation, microservicios a terceros.
5. **Operar**: consumo eléctrico, temperatura, fallas, tickets, parches, incidentes.
6. **Optimizar**: costos vs. SLAs, reputación, riesgo/legalidad, marketing.
7. **Progresar**: reinvertir, expandir, subir en ranking.

### 1.4 Modalidades
- **PvE económico**: contratos con NPCs con distintas exigencias (SLA, latencia, compliance).
- **PvP de mercado**: subastas, contratos entre jugadores, reventa de capacidad, housing.
- **PvP técnico simulado**: ataques DDoS **simulados** y mitigación (costos, reputación, caídas). *Sin instrucciones del mundo real.*

### 1.5 Sistemas principales
**A) Usuarios y Datacenters**
- Registro/login, creación de 1..N DCs por usuario con límites por progreso.
- Atributos de DC: ubicación (afecta latencia/costos), capacidad eléctrica, refrigeración, número de racks/U, redundancia (N, N+1), reputación y compliance.

**B) Inventario y Hardware**
- Unidades: **racks (U)**, **servidores**, **switches**, **routers**, **firewalls**, **UPS/PDUs**.
- Parámetros clave: precio compra/arrendo, RU ocupadas, TDP/consumo, MTBF, throughput máx, licencias.

**C) Red y Seguridad (abstracta)**
- Subredes/VLANs, rutas, balanceadores L4/L7, WAF, ACL/Rules.
- Capacidad de **mitigación DDoS** (scrubbing simulado, rate limits) con costos operativos.

**D) Kubernetes (nivel de simulación)**
- Crear clústeres, nodos (mapeados a servidores), pods/deployments, autoscaling abstracto.
- Límite por CPU/RAM/IO, interrupciones por fallos hardware o saturación.

**E) Servicios y Contratos**
- Hosting web/API, bases de datos administradas, colocation/housing, CDN simulado, backups.
- Términos: precio, duración, SLA (uptime, latencia), penalizaciones por incumplimiento.

**F) Economía y Progresión**
- Balance: ingresos por contratos y marketplace; egresos por energía, ancho de banda, mantenimiento, licencias, mitigación, staff.
- **Reputación**: afecta demanda, precios, y acceso a clientes premium.
- **Legalidad** (lícito/ilícito simulado): mayor ingreso potencial pero alto riesgo (allanamientos/eventos que congelen DC, multas ingame, pérdida de reputación). Nunca contenidos reales.

**G) Ranking y Logros**
- Ranking global por **valor del DC**, **SLA promedio**, **ingresos netos** y **reputación**.
- Logros por hitos (primer clúster estable, 99.99% mensual, 0 tickets críticos, etc.).

**H) Interacciones entre jugadores**
- Contratación cruzada de servicios (firewalls AA, tránsito/bandwidth, storage, LB como servicio).
- Contratos de housing (colocar hardware propio en DC de otro jugador) con tarifas eléctricas y RU.

### 1.6 Mecánicas de riesgo/aleatoriedad
- Fallos hardware (basados en MTBF), cortes eléctricos (según redundancia), spikes de tráfico, vulnerabilidades (parches), inspecciones de compliance.
- Eventos aleatorios con contramedidas (seguros, DR/BCP, capacity planning).

### 1.7 Progresión y desbloqueos
- Árbol de I+D: eficiencia energética, mejores firewalls, orquestadores, cooling, observabilidad.
- Desbloqueos por hitos de reputación y capital.

### 1.8 UX/UI (data‑driven)
- Tableros con KPIs: uso CPU/RAM/IO, energía (kWh), OPEX/CAPEX, uptime, tickets.
- Vistas: **Mapa de racks**, **Mapa lógico de red**, **Panel de contratos**, **Mercado**.

### 1.9 Live‑Ops / Anti‑abuso
- Moderación in‑game, límites de ataque simulado, cooldowns, logs y auditoría.
- Anti‑cheat básico en servidor (validación de economía y límites físicos).

### 1.10 Tech & arquitectura (propuesta)
- **Frontend**: Next.js 15 + React, shadcn/ui components, estado con Zustand/Redux, WebSockets para tiempo real.
- **BFF (Backend for Frontend)**: Next.js API routes como capa intermedia entre frontend y backend principal.
- **Backend**: Node.js (Nest.js), WebSocket (Socket.IO), jobs (BullMQ), DB relacional (PostgreSQL), cache (Redis).
- **Infra**: Contenedores (Docker), despliegue en VPS/K8s gerenciado + CI/CD.
- **Escalabilidad**: microservicios por dominios (usuarios, datacenters, economía, mercado, eventos).

### 1.11 Modelo de datos (borrador)
Entidades clave: `User`, `Datacenter`, `Rack`, `Device` (tipo, RU, TDP, MTBF), `Cluster`, `Node`, `Service`, `Contract`, `FirewallRule`, `BandwidthPlan`, `Incident`, `ReputationEvent`, `Transaction`, `RankingSnapshot`.

### 1.12 API (borrador)
- Auth: `POST /auth/register`, `POST /auth/login`.
- DC: `POST /dc`, `GET /dc/:id`, `POST /dc/:id/racks`, `POST /dc/:id/devices`.
- Mercado: `GET/POST /market/contracts`, `POST /contracts/:id/accept`.
- Operación: `POST /dc/:id/rules`, `POST /dc/:id/cluster`, `POST /dc/:id/mitigation`.
- Economía: `GET /wallet`, `POST /transactions`.
- Ranking: `GET /ranking`.

### 1.13 Reglas de diseño (balancing)
- Todo cuesta: energía, ancho de banda, licencias, personal.
- Simulación en **ticks** (p.ej., 1 min): aplica costos/ingresos, fallos, SLAs.
- Límites físicos: RU, amperaje, cooling, throughput.
- DDoS solo **simulado** con números abstractos (pps/bps virtuales), sin guías reales.

### 1.14 Éxito medible (KPIs)
- Retención D7/D30, sesiones diarias, contratos activos, tiempo medio entre fallos (ingame), revenue virtual por hora, tasa de cumplimiento SLA.

### 1.15 Riesgos y mitigaciones
- **Complejidad** → fases/MVP, modularización.
- **Balanceo de economía** → telemetría + ajustes server‑side.
- **Abuso** → límites PvP, mitigación y reportes.
- **Load** → pruebas con bots, escalado horizontal.

---

## 2) Documento de Plan de Ejecución (Sprints)
**Duración sugerida por sprint: 2 semanas.** Roadmap de ~12–16 semanas para MVP ampliado.

### Sprint 0 — Fundaciones (2 semanas) ✅ COMPLETADO
**Objetivo:** base técnica y prototipo de simulación.
- Tareas
  - ✅ Repo monorepo (pnpm/Turborepo). Setup CI/CD.
  - ✅ Backend Nest.js + PostgreSQL + TypeORM. Esqueleto de dominios.
  - ✅ Frontend Next.js + React + shadcn/ui. BFF setup y theming básico.
  - ✅ Auth (JWT), registro/login, perfiles.
  - ✅ Simulador de **ticks** (cron/worker) con BullMQ para eventos en tiempo real.
  - ✅ WebSocket para eventos (estado básico del DC).
- Criterios de aceptación
  - ✅ Usuario puede registrarse/iniciar sesión.
  - ✅ Tick corre en background y emite evento.
  - ✅ Pruebas unitarias básicas configuradas.

### Sprint 1 — Datacenter mínimo ✅ COMPLETADO
**Objetivo:** crear DC y gestionar racks/dispositivos.
- Tareas
  - ✅ CRUD `Datacenter`, `Rack`, `Device` con validaciones de RU y energía.
  - ✅ Catálogo inicial de hardware (JSON semilla).
  - ✅ UI: creación de DC, vista inventario, mapa simple de racks.
  - ✅ Motor económico: costos fijos (energía base), CAPEX amortizado.
- Aceptación
  - ✅ Puedo comprar/instalar un servidor y ver su impacto en kWh/costo.

### Sprint 2 — Servicios y Contratos PvE ✅ COMPLETADO
**Objetivo:** vender hosting básico a NPCs.
- Tareas
  - ✅ Entidad `Service` y `Contract` con SLA/penalizaciones.
  - ✅ Generador de demanda NPC (segmented tiers).
  - ✅ Aplicador de ingresos/penalizaciones por tick.
  - ✅ UI de contratos y métricas SLA (uptime, latencia abstracta).
  - ✅ Sistema de wallet y transacciones para revenue/expenses.
  - ✅ Integración completa del sistema NPC con tick system.
  - ✅ Resolución de dependencias circulares y problemas de inyección.
- Aceptación
  - ✅ Al menos 3 contratos simultáneos, ingresos reflejados en wallet.
  - ✅ Sistema NPC completamente funcional con evaluación automática de contratos.
  - ✅ Backend ejecutándose sin errores de dependencias.

### Sprint 2.5 — Autenticación y UI de Usuario
**Objetivo:** crear páginas de login y registro de usuarios con UI moderna.
- Tareas
  - Página de login con validación de formularios y manejo de errores.
  - Página de registro de usuarios con validación de campos.
  - Integración con sistema de autenticación JWT existente.
  - Diseño responsive y moderno usando shadcn/ui components.
  - Manejo de estados de loading y feedback visual.
  - Redirección automática después de login/registro exitoso.
  - Validación client-side y server-side.
  - Página de recuperación de contraseña (opcional).
- Aceptación
  - Usuario puede registrarse desde una página dedicada con validaciones.
  - Usuario puede iniciar sesión desde una página dedicada.
  - Manejo correcto de errores de autenticación.
  - UI responsive y consistente con el diseño del sistema.

### Sprint 3 — Red y Seguridad (abstracta)
**Objetivo:** reglas de firewall y LB básico.
- Tareas
  - Entidades `FirewallRule`, `LoadBalancer`.
  - Efectos en disponibilidad/latencia simulada.
  - UI para crear reglas y ver su impacto.
- Aceptación
  - Reglas afectan cumplimiento de SLA en contratos de alta exigencia.

### Sprint 4 — Marketplace PvP
**Objetivo:** contratos entre jugadores y housing/colocation.
- Tareas
  - Marketplace: listar ofertas de servicios (bandwidth, firewall as a service, housing).
  - Flujo de publicación/aceptación de contratos P2P.
  - Tarifación eléctrica/RU para housing.
  - Moderación/reportes básicos.
- Aceptación
  - Un jugador puede alquilar RU y ancho de banda de otro.

### Sprint 5 — Kubernetes (simulado)
**Objetivo:** clúster k8s y despliegues abstractos.
- Tareas
  - Entidades `Cluster`, `Node`, `Pod` con límites CPU/RAM/IO.
  - Autoscaling simplificado + fallos cuando hay saturación.
  - UI de clúster (nodos, pods, uso recursos) y despliegues.
- Aceptación
  - Un servicio puede correr en k8s y responder mejor a picos.

### Sprint 6 — Incidentes, Reputación y Ranking
**Objetivo:** vida operativa y metas competitivas.
- Tareas
  - Sistema `Incident` (fallos HW, cortes, inspecciones) con MTBF.
  - `ReputationEvent` que afecte demanda y precios.
  - Cálculo periódico de `RankingSnapshot` + tabla pública.
- Aceptación
  - Ranking visible y estable; incidentes impactan ingresos y reputación.

### Sprint 7 — DDoS simulado y mitigación
**Objetivo:** PvP técnico acotado.
- Tareas
  - Modelo de ataque **abstracto** (intensidad, duración, vector simbólico).
  - Mecanismo de targeting con límites/cooldowns y costos.
  - Mitigación (capacidad contratada, scrubbing simulado, rate limit) con OPEX.
  - Logs y auditoría; sin contenido técnico real de ataque.
- Aceptación
  - Un ataque reduce disponibilidad si no hay mitigación; con mitigación, impacto acotado.

### Sprint 8 — Live Ops, Balance y Telemetría (MVP listo)
**Objetivo:** preparar pruebas con usuarios.
- Tareas
  - Telemetría (Mixpanel/OSS), panel admin de economía (server‑side tuning).
  - Onboarding y tutorial interactivo.
  - Términos, reportes, filtros anti‑abuso adicionales.
  - Tests de carga y ajuste de escalado.
- Aceptación
  - Cohorte cerrada de pruebas jugando estable 1 semana sin caídas críticas.

### Backlog/Extras
- **CDN simulado**: servicio de cache/edge para reducir latencia y costos en contratos; modelar métricas como cache hit‑rate, requests/s y costos por transferencia.
- **Backups / Disaster Recovery (DR) — sitios activos‑activos**: soportar replicación entre datacenters con políticas de RPO/RTO, pruebas de failover automáticas y coste asociado (storage + transferencia).
- **Licencias por core / por instancia**: modelo de coste para software (DB, observabilidad, hypervisor) cobradas por núcleo o por instancia; incluir planes empresariales y descuentos por volumen.
- **Eventos de temporada y ligas por temporada**: temporadas con objetivos y recompensas, ligas clasificatorias y soft‑resets del ranking para mantener la competitividad y el interés a largo plazo.
- **Skins / Temas UI y personalización**: packs estéticos (cosméticos) para paneles, racks y mapas; no deben otorgar ventajas competitivas.
- **Localización (i18n) y formatos regionales**: soporte multi‑idioma y ajustes de formato para moneda, fecha y separadores decimales.
- **Marketplace avanzado**: reputación de vendedores, escrow para contratos P2P, subastas, bundles y filtros avanzados (latencia, ubicación, SLA exigido).
- **Herramientas analíticas y telemetría**: dashboards para admins y jugadores (KPIs, tiempos de respuesta, uso por rack), y panel de tuning server‑side para balanceo económico.
- **Integración de pagos y monetización**: pasarelas de pago, suscripciones premium, microtransacciones cosméticas y paquetes de aceleración no‑P2W; cumplimiento fiscal básico para real money.
- **API pública / SDK (read‑only y webhooks)**: endpoints para integraciones externas (tableros, streamers) y webhooks para eventos importantes (contratos, incidentes).
- **Sistema de misiones y logros**: misiones diarias/semanales, retos por temporada y medallas que incentiven retención y onboarding.
- **Modo 'sandbox' y entornos de test**: entornos separados donde acciones no afectan la economía global; útiles para QA, torneos y pruebas de balance.
- **Soporte y moderación ampliada**: panel de moderación, reporte/appeal de acciones, límites anti‑abuso y logs de auditoría para disputas.
- **Documentación técnica y tutoriales interactivos**: guías para nuevos jugadores, documentación API y walkthroughs de conceptos clave (sin detalles técnicos explotables sobre ataques).

### Definición de Hecho (DoD) por historia
- Tests unitarios + e2e básicos pasan.
- Validaciones de límites físicos/económicos.
- Logs y métricas básicas.
- Accesibilidad AA en pantallas nuevas.

### No‑funcionales
- Disponibilidad del backend > 99% durante pruebas.
- Escalado horizontal de websockets y workers.
- Tiempos de respuesta p95 < 200 ms para endpoints críticos.

---

## 3) Épicas y User Stories (resumen)
- **Épica: Fundación técnica**
  - Como usuario, quiero registrarme e iniciar sesión para gestionar mis DCs.
- **Épica: Construcción de DC**
  - Como operador, quiero comprar servidores y montarlos en racks para aumentar capacidad.
- **Épica: Servicios**
  - Como proveedor, quiero ofertar hosting con SLA para obtener ingresos.
- **Épica: Red/Seguridad**
  - Como operador, quiero definir reglas de firewall/LB para cumplir SLAs.
- **Épica: Mercado P2P**
  - Como jugador, quiero contratar ancho de banda/mitigación/housing a otros jugadores.
- **Épica: Operación y Reputación**
  - Como operador, quiero responder a incidentes y mejorar mi reputación.
- **Épica: Competencia PvP**
  - Como jugador, quiero lanzar ataques DDoS **simulados** para ganar ventaja (con límites y costos).

---

## 4) Glosario
- **Housing/Colocation**: alojar hardware propio en instalaciones de otro.
- **SLA**: acuerdo de nivel de servicio (uptime/latencia).
- **MTBF**: tiempo medio entre fallos.
- **Tick**: intervalo discreto de simulación que aplica cambios.

---

## 5) Notas de seguridad/ética
- Toda mecánica de ataque es **100% simulada** y abstracta; no se proveen guías reales ni detalles técnicos explotables.
- Moderación activa, límites de uso y penalizaciones ingame para conductas abusivas.

---

### Próximo paso sugerido
Comenzar por **Sprint 0** y **Sprint 1** en un branch MVP, con catálogo de hardware y simulador de ticks. Luego iterar con pruebas internas.

