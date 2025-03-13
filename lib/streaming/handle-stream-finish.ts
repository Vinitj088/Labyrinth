import { getChat, saveChat } from '@/lib/actions/chat'
import { generateRelatedQuestions } from '@/lib/agents/generate-related-questions'
import { ExtendedCoreMessage } from '@/lib/types'
import { convertToExtendedCoreMessages } from '@/lib/utils'
import { CoreMessage, DataStreamWriter, JSONValue, Message } from 'ai'

interface HandleStreamFinishParams {
  responseMessages: CoreMessage[]
  originalMessages: Message[]
  model: string
  chatId: string
  dataStream: DataStreamWriter
  skipRelatedQuestions?: boolean
  annotations?: ExtendedCoreMessage[]
}

export async function handleStreamFinish({
  responseMessages,
  originalMessages,
  model,
  chatId,
  dataStream,
  skipRelatedQuestions = false,
  annotations = []
}: HandleStreamFinishParams) {
  try {
    const extendedCoreMessages = convertToExtendedCoreMessages(originalMessages)
    let allAnnotations = [...annotations]

    if (!skipRelatedQuestions) {
      try {
        // Notify related questions loading
        const relatedQuestionsAnnotation: JSONValue = {
          type: 'related-questions',
          data: { items: [] }
        }
        dataStream.writeMessageAnnotation(relatedQuestionsAnnotation)

        // Generate related questions
        const relatedQuestions = await generateRelatedQuestions(
          responseMessages,
          model
        )

        // Create and add related questions annotation
        const updatedRelatedQuestionsAnnotation: ExtendedCoreMessage = {
          role: 'data',
          content: {
            type: 'related-questions',
            data: relatedQuestions.object
          } as JSONValue
        }

        dataStream.writeMessageAnnotation(
          updatedRelatedQuestionsAnnotation.content as JSONValue
        )
        allAnnotations.push(updatedRelatedQuestionsAnnotation)
      } catch (relatedQuestionsError) {
        console.error('Error generating related questions:', relatedQuestionsError);
        // Continue execution even if related questions fail
      }
    }

    // Create the message to save
    const generatedMessages = [
      ...extendedCoreMessages,
      ...responseMessages.slice(0, -1),
      ...allAnnotations, // Add annotations before the last message
      ...responseMessages.slice(-1)
    ] as ExtendedCoreMessage[]

    if (process.env.ENABLE_SAVE_CHAT_HISTORY !== 'true') {
      return
    }

    // Attempt to save chat history, but don't break the user experience if it fails
    try {
      // Get the chat from the database if it exists, otherwise create a new one
      const savedChat = (await getChat(chatId)) ?? {
        messages: [],
        createdAt: new Date(),
        userId: 'anonymous',
        path: `/search/${chatId}`,
        title: originalMessages[0].content,
        id: chatId
      }

      // Save chat with complete response and related questions
      await saveChat({
        ...savedChat,
        messages: generatedMessages
      })
    } catch (chatSaveError) {
      // Log the error but don't throw, allowing the chat to continue working
      console.error('Failed to save chat history:', chatSaveError);
      
      // Send a notification to the client
      try {
        dataStream.writeMessageAnnotation({
          type: 'system-message',
          text: 'Note: Your chat history could not be saved due to a technical issue.'
        } as JSONValue);
      } catch (notificationError) {
        console.error('Failed to send chat save error notification:', notificationError);
      }
    }
  } catch (error) {
    console.error('Error in handleStreamFinish:', error);
    // Don't rethrow the error to prevent breaking the stream
    try {
      dataStream.writeMessageAnnotation({
        type: 'system-message',
        text: 'An error occurred while processing your request.'
      } as JSONValue);
    } catch (notificationError) {
      console.error('Failed to send error notification:', notificationError);
    }
  }
}
