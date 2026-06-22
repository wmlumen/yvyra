/**
 * Singleton de PrismaClient.
 * 
 * En desarrollo, Prisma crea una conexión por cada `new PrismaClient()`.
 * Este módulo centraliza una única instancia para toda la app,
 * evitando conexiones duplicadas y permitiendo migrar fácilmente
 * a PostgreSQL cuando sea necesario.
 * 
 * Uso:
 *   const prisma = require('../lib/prisma');
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'test' ? [] : ['warn', 'error']
});

module.exports = prisma;
