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
  CREATE_STAFF: 'Akun staff dibuat',
  SEND_STAFF_ACTIVATION_EMAIL: 'Email aktivasi staff dikirim',
  REISSUE_STAFF_ACTIVATION: 'Tautan aktivasi staff diperbarui',
  COMPLETE_STAFF_ACTIVATION: 'Staff menyelesaikan aktivasi',
  ACTIVATE_STAFF: 'Akun staff diaktifkan',
  DEACTIVATE_STAFF: 'Akun staff dinonaktifkan',
} as const

export type AdminAuditAction = keyof typeof adminAuditActions

export const adminAccountAuditActions = [
  'CREATE', 'REISSUE_ACTIVATION', 'SEND_ACTIVATION_EMAIL',
  'COMPLETE_ACTIVATION', 'ACTIVATE', 'DEACTIVATE',
] as const satisfies ReadonlyArray<AdminAuditAction>

export const teacherAccountAuditActions = [
  'CREATE_TEACHER', 'SEND_TEACHER_ACTIVATION_EMAIL', 'REISSUE_TEACHER_ACTIVATION',
  'COMPLETE_TEACHER_ACTIVATION', 'ACTIVATE_TEACHER', 'DEACTIVATE_TEACHER',
] as const satisfies ReadonlyArray<AdminAuditAction>

export const staffAccountAuditActions = [
  'CREATE_STAFF', 'SEND_STAFF_ACTIVATION_EMAIL', 'REISSUE_STAFF_ACTIVATION',
  'COMPLETE_STAFF_ACTIVATION', 'ACTIVATE_STAFF', 'DEACTIVATE_STAFF',
] as const satisfies ReadonlyArray<AdminAuditAction>
