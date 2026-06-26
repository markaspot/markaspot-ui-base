export interface AuthUserGroupRole {
    id: string
    label: string
}

export interface AuthUserGroup {
    id: string | number
    uuid: string
    slug?: string | null
    label: string
    type: string
    roles: AuthUserGroupRole[]
    jurisdiction_id?: string | number | null
}

export interface AuthUser {
    uid: string | number
    uuid?: string
    name: string
    email: string
    roles: string[]
    permissions?: string[]
    groups: AuthUserGroup[]
    preferred_langcode?: string
    tos_accepted?: boolean
    tos_accepted_at?: number | null
}

export interface AuthResponse {
    success?: boolean
    message?: string
    error?: string
    expiresIn?: number
    user?: AuthUser
}

export interface AuthStatusResponse {
    authenticated: boolean
    user?: AuthUser
}
