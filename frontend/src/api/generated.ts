/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface UpdateUserRequestDto {
  username?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

export interface UserDto {
  /** @format int64 */
  id: number;
  username: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

export interface ResetPasswordRequestDto {
  newPassword?: string;
}

export interface CreateUserRequestDto {
  username: string;
  password: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

export interface CreateElectionRequestDto {
  title?: string;
  /** @uniqueItems true */
  candidateIds?: number[];
  /** @uniqueItems true */
  eligibleVoterIds?: number[];
}

export interface ElectionDto {
  /** @format int64 */
  id?: number;
  title?: string;
  status?: string;
  candidates?: UserDto[];
  eligibleVoters?: UserDto[];
  /** @uniqueItems true */
  userIdsWhoVoted?: number[];
}

export interface CastVoteRequestDto {
  /** @format int64 */
  candidateId?: number;
}

export interface ElectionResultDto {
  /** @format int64 */
  candidateId?: number;
  candidateName?: string;
  /** @format int64 */
  count?: number;
}

import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  HeadersDefaults,
  ResponseType,
} from "axios";
import axios from "axios";

export type QueryParamsType = Record<string | number, any>;

export interface FullRequestParams
  extends Omit<AxiosRequestConfig, "data" | "params" | "url" | "responseType"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseType;
  /** request body */
  body?: unknown;
}

export type RequestParams = Omit<
  FullRequestParams,
  "body" | "method" | "query" | "path"
>;

export interface ApiConfig<SecurityDataType = unknown>
  extends Omit<AxiosRequestConfig, "data" | "cancelToken"> {
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<AxiosRequestConfig | void> | AxiosRequestConfig | void;
  secure?: boolean;
  format?: ResponseType;
}

export enum ContentType {
  Json = "application/json",
  JsonApi = "application/vnd.api+json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public instance: AxiosInstance;
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private secure?: boolean;
  private format?: ResponseType;

  constructor({
    securityWorker,
    secure,
    format,
    ...axiosConfig
  }: ApiConfig<SecurityDataType> = {}) {
    this.instance = axios.create({
      ...axiosConfig,
      baseURL: axiosConfig.baseURL || "http://localhost:8080",
    });
    this.secure = secure;
    this.format = format;
    this.securityWorker = securityWorker;
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected mergeRequestParams(
    params1: AxiosRequestConfig,
    params2?: AxiosRequestConfig,
  ): AxiosRequestConfig {
    const method = params1.method || (params2 && params2.method);

    return {
      ...this.instance.defaults,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...((method &&
          this.instance.defaults.headers[
            method.toLowerCase() as keyof HeadersDefaults
          ]) ||
          {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected stringifyFormItem(formItem: unknown) {
    if (typeof formItem === "object" && formItem !== null) {
      return JSON.stringify(formItem);
    } else {
      return `${formItem}`;
    }
  }

  protected createFormData(input: Record<string, unknown>): FormData {
    if (input instanceof FormData) {
      return input;
    }
    return Object.keys(input || {}).reduce((formData, key) => {
      const property = input[key];
      const propertyContent: any[] =
        property instanceof Array ? property : [property];

      for (const formItem of propertyContent) {
        const isFileType = formItem instanceof Blob || formItem instanceof File;
        formData.append(
          key,
          isFileType ? formItem : this.stringifyFormItem(formItem),
        );
      }

      return formData;
    }, new FormData());
  }

  public request = async <T = any, _E = any>({
    secure,
    path,
    type,
    query,
    format,
    body,
    ...params
  }: FullRequestParams): Promise<AxiosResponse<T>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const responseFormat = format || this.format || undefined;

    if (
      type === ContentType.FormData &&
      body &&
      body !== null &&
      typeof body === "object"
    ) {
      body = this.createFormData(body as Record<string, unknown>);
    }

    if (
      type === ContentType.Text &&
      body &&
      body !== null &&
      typeof body !== "string"
    ) {
      body = JSON.stringify(body);
    }

    return this.instance.request({
      ...requestParams,
      headers: {
        ...(requestParams.headers || {}),
        ...(type ? { "Content-Type": type } : {}),
      },
      params: query,
      responseType: responseFormat,
      data: body,
      url: path,
    });
  };
}

/**
 * @title OpenAPI definition
 * @version v0
 * @baseUrl http://localhost:8080
 */
export class Api<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  api = {
    /**
     * No description
     *
     * @tags user-controller
     * @name UpdateUser
     * @request PUT:/api/users/{id}
     */
    updateUser: (
      id: number,
      data: UpdateUserRequestDto,
      params: RequestParams = {},
    ) =>
      this.request<UserDto, any>({
        path: `/api/users/${id}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags user-controller
     * @name DeleteUser
     * @request DELETE:/api/users/{id}
     */
    deleteUser: (id: number, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/users/${id}`,
        method: "DELETE",
        ...params,
      }),

    /**
     * No description
     *
     * @tags user-controller
     * @name ResetPassword
     * @request PUT:/api/users/{id}/password
     */
    resetPassword: (
      id: number,
      data: ResetPasswordRequestDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/users/${id}/password`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags user-controller
     * @name GetUsers
     * @request GET:/api/users
     */
    getUsers: (params: RequestParams = {}) =>
      this.request<UserDto[], any>({
        path: `/api/users`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags user-controller
     * @name CreateUser
     * @request POST:/api/users
     */
    createUser: (data: CreateUserRequestDto, params: RequestParams = {}) =>
      this.request<UserDto, any>({
        path: `/api/users`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags election-controller
     * @name GetElections
     * @request GET:/api/elections
     */
    getElections: (params: RequestParams = {}) =>
      this.request<ElectionDto[], any>({
        path: `/api/elections`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags election-controller
     * @name CreateElection
     * @request POST:/api/elections
     */
    createElection: (
      data: CreateElectionRequestDto,
      params: RequestParams = {},
    ) =>
      this.request<ElectionDto, any>({
        path: `/api/elections`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags election-controller
     * @name CastVote
     * @request POST:/api/elections/{id}/vote
     */
    castVote: (
      id: number,
      data: CastVoteRequestDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/elections/${id}/vote`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags election-controller
     * @name CloseElection
     * @request POST:/api/elections/{id}/close
     */
    closeElection: (id: number, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/elections/${id}/close`,
        method: "POST",
        ...params,
      }),

    /**
     * No description
     *
     * @tags election-controller
     * @name GetElection
     * @request GET:/api/elections/{id}
     */
    getElection: (id: number, params: RequestParams = {}) =>
      this.request<ElectionDto, any>({
        path: `/api/elections/${id}`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags election-controller
     * @name DeleteElection
     * @request DELETE:/api/elections/{id}
     */
    deleteElection: (id: number, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/elections/${id}`,
        method: "DELETE",
        ...params,
      }),

    /**
     * No description
     *
     * @tags election-controller
     * @name GetResults
     * @request GET:/api/elections/{id}/results
     */
    getResults: (id: number, params: RequestParams = {}) =>
      this.request<ElectionResultDto[], any>({
        path: `/api/elections/${id}/results`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags auth-controller
     * @name GetCurrentUser
     * @request GET:/api/auth/me
     */
    getCurrentUser: (params: RequestParams = {}) =>
      this.request<UserDto, any>({
        path: `/api/auth/me`,
        method: "GET",
        ...params,
      }),
  };
}
