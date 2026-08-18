# FAATPRO ERP — Development Environment

## Technology Stack

- Next.js
- TypeScript
- React
- Tailwind CSS
- Drizzle ORM
- PostgreSQL

## Environment Files

`.env` and `.env.local` contain local configuration and must never be committed.

`.env.example` contains only placeholder values and can be committed.

## Database

The application uses PostgreSQL through Drizzle ORM.

Required variable:

```env
DATABASE_URL=postgresql://USERNAME:PASSWORD@localhost:5432/DB_NAME
```
