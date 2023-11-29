/* eslint-disable import/no-unresolved*/
import prisma from "../lib/prisma.js";
import { getModelByName } from "@adminjs/prisma";
import { ComponentLoader } from "adminjs";
import {
  targetRelationSettingsFeature,
  owningRelationSettingsFeature,
} from "@adminjs/relations";
import path from "path";
import { fileURLToPath } from "url";
import camelCase from "lodash/camelCase.js";
import lowerCase from "lodash/lowerCase.js";
import { MODELS } from "../../src/utils/constants.js";
import resourceOptions from "./utils/resourceOptions.js";

const serializeFileResponse = (originalResponse) => {
  const { record } = originalResponse;
  return {
    ...originalResponse,
    record: {
      ...record,
      params: serializeFileParams(record.params),
    },
  };
};

const serializeFilesResponse = (originalResponse) => {
  return {
    ...originalResponse,
    records: originalResponse.records.map((record) => {
      return {
        ...record,
        params: serializeFileParams(record.params),
      };
    }),
  };
};

const serializeFileParams = (params) => {
  return {
    ...params,
    sizeBytes: params.sizeBytes?.toString(),
  };
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RELATIONSHIP_TYPE = {
  ONE_TO_MANY: "one-to-many",
  MANY_TO_MANY: "many-to-many",
};

export class Admin {
  constructor() {
    this.componentLoader = new ComponentLoader();
    this.components = {
      CustomDashboard: this.componentLoader.add(
        "CustomDashboard",
        path.resolve(__dirname, "views/Dashboard")
      ),
      UserName: this.componentLoader.add(
        "UserName",
        path.resolve(__dirname, "components/UserName")
      ),
      AuthorizationForm: this.componentLoader.add(
        "AuthorizationForm",
        path.resolve(__dirname, "forms/AuthorizationForm")
      ),
    };
  }

  createDefaultResource(model) {
    return {
      resource: {
        model: getModelByName(model),
        client: prisma,
      },
      options: resourceOptions.defaultProperties,
    };
  }

  getResources = () => {
    return [
      this.createUserResource(),
      this.createFolderResource(),
      this.createFileResource(),
      this.createAuthorizationResource(),
    ];
  };

  getAdminOptions = () => {
    return {
      resources: this.getResources(),
      dashboard: {
        component: this.components.CustomDashboard,
      },
      componentLoader: this.componentLoader,
    };
  };

  createFileResource = () => {
    const defaults = this.createDefaultResource(MODELS.FILE);

    return {
      ...defaults,
      options: {
        ...defaults.options,
        actions: {
          ...defaults.options.actions,
          list: {
            after: serializeFilesResponse,
          },
          show: {
            after: serializeFileResponse,
          },
        },
        properties: {
          ...defaults.options.properties,
          user: {
            ...resourceOptions.neverVisible,
          },
        },
      },
      features: [
        this.createOwningRelationSettingsFeature(MODELS.FILE, [
          {
            modelName: MODELS.AUTHORIZATION,
            relationshipType: RELATIONSHIP_TYPE.ONE_TO_MANY,
          },
        ]),
      ],
    };
  };

  createFolderResource = () => {
    return {
      ...this.createDefaultResource(MODELS.FOLDER),
      options: {
        properties: {
          id: {
            ...resourceOptions.neverVisible,
          },
          user: {
            ...resourceOptions.neverVisible,
          },
        },
      },
      features: [
        this.createOwningRelationSettingsFeature(MODELS.FOLDER, [
          {
            modelName: MODELS.AUTHORIZATION,
            relationshipType: RELATIONSHIP_TYPE.ONE_TO_MANY,
          },
          {
            modelName: MODELS.FILE,
            relationshipType: RELATIONSHIP_TYPE.ONE_TO_MANY,
          },
        ]),
      ],
    };
  };

  createUserResource = () => {
    return {
      ...this.createDefaultResource(MODELS.USER),
      features: [
        this.createOwningRelationSettingsFeature(MODELS.USER, [
          {
            modelName: MODELS.AUTHORIZATION,
            relationshipType: RELATIONSHIP_TYPE.ONE_TO_MANY,
          },
          {
            modelName: MODELS.SIGN_IN,
            relationshipType: RELATIONSHIP_TYPE.ONE_TO_MANY,
          },
        ]),
      ],
    };
  };

  createAuthorizationResource = () => {
    return {
      ...this.createDefaultResource(MODELS.AUTHORIZATION),
      ...this.createTargetResourceFeature(),
      options: {
        properties: {
          id: {
            isVisible: {
              list: false,
              show: true,
              edit: false,
              filter: true,
            },
          },
          user: {
            ...resourceOptions.neverVisible,
          },
        },
        actions: {
          new: {
            component: this.components.AuthorizationForm,
          },
        },
      },
    };
  };

  createSignInResource = () => {
    const defaults = this.createDefaultResource(MODELS.SIGN_IN);

    return {
      ...defaults,
      options: {
        ...defaults.options,
        actions: {
          new: {
            isAccessible: false,
          },
        },
      },
      ...this.createTargetResourceFeature(),
    };
  };

  createTargetResourceFeature = () => {
    return {
      features: [targetRelationSettingsFeature()],
    };
  };

  // targetModels is array of objects in format { modelName: 'User', relationshipType: 'one-to-many' }
  createOwningRelationSettingsFeature = (parentModel, targetModels) => {
    let relationsObj = {};
    targetModels.forEach(({ modelName, relationshipType }) => {
      const key = camelCase(modelName) + "s";
      relationsObj[key] = {
        type: relationshipType,
        target: {
          joinKey: lowerCase(parentModel),
          resourceId: modelName,
        },
      };
    });

    return owningRelationSettingsFeature({
      componentLoader: this.componentLoader,
      licenseKey: process.env.ADMINJS_RELATIONS_KEY,
      relations: {
        ...relationsObj,
      },
    });
  };
}
