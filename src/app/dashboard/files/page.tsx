"use client"
import { redirect } from 'next/navigation'

export default function FilesRedirectPage() {
  redirect('/dashboard/bots')
  return null
}

    