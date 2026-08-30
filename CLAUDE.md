# NodoSkatepark — Instrucciones para agentes

## Comandos Spec Kit: preguntas con opciones

Siempre que un comando de Spec Kit (`/speckit-clarify`, `/speckit-specify`, `/speckit-plan`,
`/speckit-tasks`, `/speckit-checklist`, `/speckit-analyze`, `/speckit-converge`,
`/speckit-implement`, `/speckit-constitution`, `/speckit-taskstoissues`) tenga que presentar
opciones para que yo elija —una pregunta de opción múltiple, una recomendación a confirmar, o
cualquier bifurcación de decisión— MUST usar la herramienta `AskUserQuestion` en lugar de
escribir las opciones como texto o como tabla Markdown en la respuesta.

Reglas al usarla:

- Una pregunta por llamada, en el orden de prioridad que el comando haya definido.
- La opción recomendada va primera, con `(Recomendada)` al final de su etiqueta.
- El texto de `question` MUST ser una pregunta completa terminada en `?`, comprensible por sí
  sola, nunca una etiqueta de tema ni un id de requisito suelto.
- La `description` de cada opción explica la consecuencia de elegirla, no solo la repite.
- El resto del flujo del comando (registrar la respuesta en `## Clarifications`, integrarla en
  la sección correspondiente del spec, guardar el archivo) no cambia.

Esto aplica también cuando el comando trae su propio formato de tabla en las instrucciones: la
tabla se reemplaza por la herramienta.
