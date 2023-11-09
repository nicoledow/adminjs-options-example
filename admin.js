import prisma from '../lib/prisma.js'
/* eslint-disable-next-line import/no-unresolved*/
import { getModelByName } from '@adminjs/prisma'
/* eslint-disable-next-line import/no-unresolved*/
import { ComponentLoader } from 'adminjs'
import {
  targetRelationSettingsFeature,
  owningRelationSettingsFeature,
} from '@adminjs/relations'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const MODELS = {
  USER: 'User',
  FILE: 'File',
  FOLDER: 'Folder',
  AUTHORIZATION: 'Authorization',
}

const RELATIONSHIP_TYPE = {
  ONE_TO_MANY: 'one-to-many',
  MANY_TO_MANY: 'many-to-many',
}

const DEFAULT_RESOURCE_OPTIONS = {
  properties: {
    id: {
      isVisible: {
        edit: false,
        show: false,
        list: false,
        filter: true,
      },
    },
  },
}

export class Admin {
  constructor() {
    this.componentLoader = new ComponentLoader()
    this.components = {
      CustomDashboard: this.componentLoader.add(
        'CustomDashboard',
        path.resolve(__dirname, 'views/Dashboard')
      ),
    }
  }

  createDefaultResource(model) {
    return {
      resource: {
        model: getModelByName(model),
        client: prisma,
      },
      options: DEFAULT_RESOURCE_OPTIONS,
    }
  }

  getResources = () => {
    return [
      this.createUserResource(),
      this.createFolderResource(),
      this.createAuthorizationResource(),
      this.createDefaultResource('File'),
      this.createDefaultResource('Case'),
      this.createDefaultResource('Proceeding'),
      this.createDefaultResource('UserProceeding'),
      this.createDefaultResource('LoginLink'),
      this.createDefaultResource('SignIn'),
    ]
  }

  getAdminOptions = () => {
    return {
      resources: this.getResources(),
      dashboard: {
        component: this.components.CustomDashboard,
      },
      componentLoader: this.componentLoader,
    }
  }

  createFolderResource = () => {
    return {
      ...this.createDefaultResource('Folder'),
      features: [
        owningRelationSettingsFeature({
          componentLoader: this.componentLoader,
          licenseKey: process.env.ADMINJS_RELATIONS_KEY,
          relations: {
            authorizations: {
              type: RELATIONSHIP_TYPE.ONE_TO_MANY,
              target: {
                joinKey: 'folderId',
                resourceId: 'Authorization',
              },
            },
          },
        }),
      ],
    }
  }

  createUserResource = () => {
    return {
      ...this.createDefaultResource('User'),
      features: [
        owningRelationSettingsFeature({
          componentLoader: this.componentLoader,
          licenseKey: process.env.ADMINJS_RELATIONS_KEY,
          relations: {
            authorizations: {
              type: RELATIONSHIP_TYPE.ONE_TO_MANY,
              target: {
                joinKey: 'userId',
                resourceId: 'Authorization',
              },
            },
          }
        })
      ]
    }
  }

  createAuthorizationResource = () => {
    return {
      resource: {
        model: getModelByName('Authorization'),
        client: prisma,
      },
      features: [targetRelationSettingsFeature()],
    }
  }
}
