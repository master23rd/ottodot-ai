export const adminAuditActions = {
  CREATE: 'Akun dibuat',
  REISSUE_ACTIVATION: 'Tautan aktivasi diperbarui',
  SEND_ACTIVATION_EMAIL: 'Email aktivasi dikirim',
  COMPLETE_ACTIVATION: 'Admin menyelesaikan aktivasi',
  ACTIVATE: 'Akun diaktifkan',
  DEACTIVATE: 'Akun dinonaktifkan',
  CREATE_TEACHER: 'Akun teacher dibuat',
  SEND_TEACHER_ACTIVATION_EMAIL: 'Email aktivasi teacher dikirim',
  REISSUE_TEACHER_ACTIVATION: 'Tautan aktivasi teacher diperbarui',
  COMPLETE_TEACHER_ACTIVATION: 'Teacher menyelesaikan aktivasi',
  ACTIVATE_TEACHER: 'Akun teacher diaktifkan',
  DEACTIVATE_TEACHER: 'Akun teacher dinonaktifkan',
} as const

export type AdminAuditAction = keyof typeof adminAuditActions
