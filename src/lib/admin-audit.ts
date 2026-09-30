export const adminAuditActions = {
  CREATE: 'Akun dibuat',
  REISSUE_ACTIVATION: 'Tautan aktivasi diperbarui',
  COMPLETE_ACTIVATION: 'Admin menyelesaikan aktivasi',
  ACTIVATE: 'Akun diaktifkan',
  DEACTIVATE: 'Akun dinonaktifkan',
} as const

export type AdminAuditAction = keyof typeof adminAuditActions
