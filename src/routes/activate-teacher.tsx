import { createFileRoute } from '@tanstack/react-router'
import { OperatorActivationPage } from '@/components/OperatorActivationPage'
import { completeTeacherActivation } from '@/lib/teacher.functions'

export const Route = createFileRoute('/activate-teacher')({
  component: () => <OperatorActivationPage role="teacher" contact="admin" completeActivation={(data) => completeTeacherActivation({ data })} />,
})
