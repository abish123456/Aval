import { redirect } from 'next/navigation'

// Orders are managed on the Bridal Orders (enquiries) page.
export default function AdminOrdersPage() {
  redirect('/admin/enquiries')
}
