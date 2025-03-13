import { Chat } from '@/components/chat'
import { LoadingSpinner } from '@/components/loading-spinner'
import { getChat } from '@/lib/actions/chat'
import { authOptions } from '@/lib/auth'
import { getModels } from '@/lib/config/models'
import { convertToUIMessages } from '@/lib/utils'
import { getServerSession } from 'next-auth'
import { notFound, redirect } from 'next/navigation'
import { Suspense } from 'react'

export const maxDuration = 60
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata({
  params
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)
  const { id } = params
  const chat = await getChat(id, session?.user?.id)
  return {
    title: chat?.title?.toString().slice(0, 50) || 'Search'
  }
}

export default async function SearchPage({
  params
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/sign-in')
  }

  const { id } = params
  const chat = await getChat(id, session.user.id)
  
  if (!chat) {
    redirect('/')
  }

  if (chat?.userId !== session.user.id) {
    notFound()
  }

  const messages = convertToUIMessages(chat?.messages || [])
  const models = await getModels()

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Chat id={id} savedMessages={messages} models={models} />
    </Suspense>
  )
}

