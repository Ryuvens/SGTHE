import '@testing-library/jest-dom'
import { beforeAll, afterAll, afterEach } from 'vitest'
import { mockDeep, mockReset } from 'vitest-mock-extended'
import type { PrismaClient } from '@prisma/client'

// Mock de Prisma
export const prismaMock = mockDeep<PrismaClient>()

beforeAll(() => {
  // Setup global
})

afterEach(() => {
  mockReset(prismaMock)
})

afterAll(() => {
  // Cleanup
})

