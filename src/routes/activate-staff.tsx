import { createFileRoute } from '@tanstack/react-router'
import { OperatorActivationPage } from '@/components/OperatorActivationPage'
import { completeStaffActivation } from '@/lib/staff.functions'

export const Route = createFileRoute('/activate-staff')({
  component: () => <OperatorActivationPage role="staff" contact="admin" completeActivation={(data) => completeStaffActivation({ data })} />,
})
