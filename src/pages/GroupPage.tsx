import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'

import * as api from '../api/endpoints.ts'
import { Button, EmptyState, ErrorText, Loading, TextField } from '../components/ui.tsx'
import { useI18n } from '../i18n/useI18n.ts'

export function GroupPage() {
  const { t } = useI18n()
  const { groupId = '' } = useParams()
  const groups = useQuery({ queryKey: api.queryKeys.groups, queryFn: api.listGroups })
  const membership = groups.data?.find((candidate) => candidate.groupId === groupId)

  if (groups.isPending) return <Loading label={t.common.loading} />

  if (!membership) {
    return (
      <div className="page">
        <Link to="/" className="back-link">
          ‹ {t.group.allGroups}
        </Link>
        <EmptyState>{t.group.notFound}</EmptyState>
      </div>
    )
  }

  return (
    <div className="page">
      <Link to="/" className="back-link">
        ‹ {t.group.allGroups}
      </Link>
      <h1 className="page-title">{membership.groupName}</h1>
      <ListsSection groupId={groupId} />
      <MembersSection membership={membership} />
    </div>
  )
}

function ListsSection({ groupId }: { groupId: string }) {
  const { t, formatError } = useI18n()
  const lists = useQuery({ queryKey: api.queryKeys.groupLists(groupId), queryFn: () => api.listGroupLists(groupId) })

  return (
    <section className="section">
      <h2>{t.group.lists}</h2>
      {lists.isPending ? <Loading label={t.common.loading} /> : null}
      <ErrorText error={lists.error ? formatError(lists.error) : null} />
      {lists.data && lists.data.length === 0 ? <EmptyState>{t.group.noLists}</EmptyState> : null}
      <ul className="stack">
        {lists.data?.map((list) => (
          <li key={list.id}>
            <Link to={`/groups/${groupId}/lists/${list.id}`} className="card card-link">
              <span className="card-link-title">{list.name}</span>
              <span className={`badge badge-${list.status}`}>{t.listStatus[list.status]}</span>
              <span className="card-link-arrow" aria-hidden="true">
                ›
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <CreateListForm groupId={groupId} />
    </section>
  )
}

function CreateListForm({ groupId }: { groupId: string }) {
  const { t, formatError } = useI18n()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const create = useMutation({
    mutationFn: (listName: string) => api.createList(groupId, listName),
    onSuccess: async ({ listId }) => {
      setName('')
      await queryClient.invalidateQueries({ queryKey: api.queryKeys.groupLists(groupId) })
      navigate(`/groups/${groupId}/lists/${listId}`)
    },
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (trimmed) create.mutate(trimmed)
  }

  return (
    <form className="inline-form" onSubmit={handleSubmit}>
      <TextField label={t.group.newListLabel} hideLabel placeholder={t.group.newListPlaceholder} value={name} onChange={setName} />
      <Button type="submit" disabled={create.isPending || !name.trim()}>
        {t.group.createList}
      </Button>
      <ErrorText error={create.error ? formatError(create.error) : null} />
    </form>
  )
}

function MembersSection({ membership }: { membership: api.GroupMember }) {
  const { groupId, userId: myUserId } = membership
  const isOwner = membership.roles.includes('owner')
  const { t, formatError } = useI18n()
  const members = useQuery({ queryKey: api.queryKeys.groupMembers(groupId), queryFn: () => api.listGroupMembers(groupId) })
  const invites = useQuery({ queryKey: api.queryKeys.groupInvites(groupId), queryFn: () => api.listGroupInvites(groupId) })
  const pendingCount = invites.data?.length ?? 0

  return (
    <section className="section">
      <h2>{t.group.members}</h2>
      {members.isPending ? <Loading label={t.common.loading} /> : null}
      <ErrorText error={members.error ? formatError(members.error) : null} />
      <ul className="card member-list">
        {members.data?.map((member) => (
          <li key={member.id} className="row">
            <span className="avatar" aria-hidden="true">
              {initials(member.userName, member.userLastName)}
            </span>
            <span className="member-name">
              {member.userName} {member.userLastName}
              {member.userId === myUserId ? <span className="muted"> {t.common.you}</span> : null}
            </span>
            {member.roles.includes('owner') ? <span className="badge">{t.common.owner}</span> : null}
          </li>
        ))}
      </ul>
      {pendingCount > 0 ? (
        <p className="muted">{t.group.pendingInvites(pendingCount)}</p>
      ) : null}
      {isOwner ? <InviteForm groupId={groupId} /> : <p className="muted">{t.group.ownerOnlyInvites}</p>}
    </section>
  )
}

function InviteForm({ groupId }: { groupId: string }) {
  const { t, formatError } = useI18n()
  const queryClient = useQueryClient()
  const [username, setUsername] = useState('')
  const [sentTo, setSentTo] = useState<string | null>(null)
  const invite = useMutation({
    mutationFn: (invitedUsername: string) => api.inviteUser(groupId, invitedUsername),
    onSuccess: (_, invitedUsername) => {
      setUsername('')
      setSentTo(invitedUsername)
      void queryClient.invalidateQueries({ queryKey: api.queryKeys.groupInvites(groupId) })
    },
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = username.trim().replace(/^@/, '')
    if (!trimmed) return
    setSentTo(null)
    invite.mutate(trimmed)
  }

  return (
    <form className="inline-form" onSubmit={handleSubmit}>
      <TextField label={t.group.inviteLabel} hideLabel placeholder={t.group.inviteLabel} value={username} onChange={setUsername} />
      <Button type="submit" variant="secondary" disabled={invite.isPending || !username.trim()}>
        {t.group.sendInvite}
      </Button>
      {sentTo ? <p className="success-text">{t.group.inviteSent(sentTo)}</p> : null}
      <ErrorText error={invite.error ? formatError(invite.error) : null} />
    </form>
  )
}

function initials(name: string, lastName: string) {
  return `${name.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}
