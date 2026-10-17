import { request } from './client.ts'

export const queryKeys = {
  groups: ['groups'] as const,
  myInvites: ['invites'] as const,
  products: ['products'] as const,
  groupMembers: (groupId: string) => ['groups', groupId, 'members'] as const,
  groupInvites: (groupId: string) => ['groups', groupId, 'invites'] as const,
  groupLists: (groupId: string) => ['groups', groupId, 'lists'] as const,
  listItems: (listId: string) => ['lists', listId, 'items'] as const,
}

export type RegisterForm = {
  name: string
  lastName: string
  username: string
  password: string
}

export type LoginForm = {
  username: string
  password: string
}

export type LoginResponse = {
  message: string
  username: string
}

export function register(form: RegisterForm) {
  return request<void>('POST', '/users', form)
}

export function login(form: LoginForm) {
  return request<LoginResponse>('POST', '/users/login', form)
}

export function logout() {
  return request<void>('POST', '/users/logout')
}

/**
 * A user's membership in a group. Listing "my groups" returns these rather than
 * bare groups, so each entry also carries the caller's own user id and roles.
 */
export type GroupMember = {
  id: string
  userId: string
  userName: string
  userLastName: string
  groupId: string
  groupName: string
  roles: string[]
}

export async function listGroups() {
  return (await request<GroupMember[] | null>('GET', '/groups')) ?? []
}

export function createGroup(name: string) {
  return request<{ groupId: string; userId: string }>('POST', '/groups', { name })
}

export async function listGroupMembers(groupId: string) {
  return (await request<GroupMember[] | null>('GET', `/groups/${groupId}/members`)) ?? []
}

export type PendingInvite = {
  id: string
  groupId: string
  groupName: string
  senderId: string
  senderUsername: string
}

export async function listMyInvites() {
  return (await request<PendingInvite[] | null>('GET', '/invites')) ?? []
}

export async function listGroupInvites(groupId: string) {
  return (await request<PendingInvite[] | null>('GET', `/groups/${groupId}/invites`)) ?? []
}

export function inviteUser(groupId: string, invitedUsername: string) {
  return request<{ inviteId: string }>('POST', `/groups/${groupId}/invites`, { invitedUsername })
}

export function acceptInvite(groupId: string) {
  return request<unknown>('POST', `/groups/${groupId}/invites/accept`)
}

export type ListStatus = 'planning' | 'active' | 'completed'

export type ShoppingList = {
  id: string
  groupId: string
  createdBy: string
  name: string
  status: ListStatus
}

export async function listGroupLists(groupId: string) {
  return (await request<ShoppingList[] | null>('GET', `/groups/${groupId}/lists`)) ?? []
}

export function createList(groupId: string, name: string) {
  return request<{ listId: string }>('POST', `/groups/${groupId}/lists`, { name })
}

export function updateListStatus(listId: string, status: ListStatus) {
  return request<unknown>('PATCH', `/lists/${listId}/status`, { status })
}

export type ItemStatus = 'pending' | 'in_cart' | 'purchased' | 'cancelled'

export type ListItem = {
  id: string
  productId: string
  productName: string
  addedBy: string
  quantity: number
  unit: string
  status: ItemStatus
  note: string
}

export async function listItems(listId: string) {
  return (await request<ListItem[] | null>('GET', `/lists/${listId}/items`)) ?? []
}

export type AddItemForm = {
  productId: string
  quantity?: number
  unit?: string
  note?: string
}

export function addItem(listId: string, form: AddItemForm) {
  return request<{ itemId: string }>('POST', `/lists/${listId}/items`, form)
}

export type UpdateItemForm = {
  quantity?: number
  unit?: string
  note?: string
}

export function updateItem(listId: string, itemId: string, form: UpdateItemForm) {
  return request<unknown>('PATCH', `/lists/${listId}/items/${itemId}`, form)
}

export function deleteItem(listId: string, itemId: string) {
  return request<void>('DELETE', `/lists/${listId}/items/${itemId}`)
}

export function incrementItem(listId: string, itemId: string) {
  return request<unknown>('POST', `/lists/${listId}/items/${itemId}/increment`)
}

export function decrementItem(listId: string, itemId: string) {
  return request<unknown>('POST', `/lists/${listId}/items/${itemId}/decrement`)
}

export function updateItemStatus(listId: string, itemId: string, status: ItemStatus) {
  return request<unknown>('PATCH', `/lists/${listId}/items/${itemId}/status`, { status })
}

export type Product = {
  id: string
  name: string
  description: string
  predefinedUnit: string
}

export async function listProducts() {
  return (await request<Product[] | null>('GET', '/products')) ?? []
}

export type ProductForm = {
  name: string
  description: string
  predefinedUnit: string
}

export function createProduct(form: ProductForm) {
  return request<void>('POST', '/products', form)
}
