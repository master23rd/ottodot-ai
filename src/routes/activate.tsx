import { createFileRoute } from '@tanstack/react-router'
import { OperatorActivationPage } from '@/components/OperatorActivationPage'
import { completeAdminActivation } from '@/lib/admin.functions'

export const Route = createFileRoute('/activate')({
  component: () => <OperatorActivationPage role="admin" contact="superadmin" completeActivation={(data) => completeAdminActivation({ data })} />,
})
