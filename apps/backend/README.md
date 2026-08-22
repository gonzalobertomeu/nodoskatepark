# apps/backend

NestJS backend (Clean Architecture: `domain/`, `application/`, `infrastructure/`).

## Bun-first exception (Constitution Principle I)

The TypeScript **compiler** for this app is `tsc`, invoked via `nest build` / `nest start`
(NestJS's CLI), not Bun's native transpiler. NestJS's dependency injection relies on
`emitDecoratorMetadata`-generated `Reflect.defineMetadata` calls, which Bun's built-in
transpiler does not currently produce in a way compatible with Nest's decorator runtime. Every
other tool — the package manager, the **runtime** that executes the compiled output
(`bun dist/main.js`, see `Dockerfile`), and `bun test` — stays on Bun.

## Local development

```bash
cp .env.example .env   # fill in DATABASE_URL etc.
bunx prisma migrate deploy --schema prisma/schema.prisma
bun run dev             # nest start --watch
```
