/**
 * THIS FILE IS AUTO‐GENERATED. DO NOT EDIT.
 */
import { Status } from "@/api/schemas";
import { env } from "@/env";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import axios from "axios";
import { z } from "zod";

export const caller = axios.create({
  baseURL: env.VITE_BACKEND,
  withCredentials: true,
});

const ValidateTokenResp = z.boolean();
type ValidateTokenResp = z.infer<typeof ValidateTokenResp>;
const RedirectParams = z.object({
  security_token: z.string(),
  to: z.string(),
});
type RedirectParams = z.infer<typeof RedirectParams>;

const RedirectResp = z.void();
type RedirectResp = z.infer<typeof RedirectResp>;

const GetTokenResp = z.void();
type GetTokenResp = z.infer<typeof GetTokenResp>;

const GetMetricsResp = z.record(z.string(), z.unknown());
type GetMetricsResp = z.infer<typeof GetMetricsResp>;

const GetExample1Resp = z.array(z.string());
type GetExample1Resp = z.infer<typeof GetExample1Resp>;

const GetEnvResp = z.void();
type GetEnvResp = z.infer<typeof GetEnvResp>;
const SpaParams = z.object({
  full_path: z.string(),
});
type SpaParams = z.infer<typeof SpaParams>;

const SpaResp = z.void();
type SpaResp = z.infer<typeof SpaResp>;
export const api = {
  auth: {
    useValidateToken: (options?: Partial<UseQueryOptions<ValidateTokenResp>>) =>
      useQuery<ValidateTokenResp>({
        ...(options ?? {}),
        queryKey: ["useValidateToken"],
        queryFn: ({ signal }) =>
          caller
            .get<ValidateTokenResp>(`/auth/validate`, { signal })
            .then(({ data }) => ValidateTokenResp.parse(data)),
      }),

    useRedirect: (
      params: RedirectParams,
      options?: Partial<UseQueryOptions<RedirectResp>>
    ) =>
      useQuery<RedirectResp>({
        ...(options ?? {}),
        queryKey: ["useRedirect", params],
        queryFn: ({ signal, queryKey }) =>
          caller
            .get<RedirectResp>(
              `/auth/redirect?security_token=${(queryKey[1] as RedirectParams).security_token}&to=${(queryKey[1] as RedirectParams).to}`,
              { signal }
            )
            .then(({ data }) => RedirectResp.parse(data)),
      }),

    useGetToken: (options?: Partial<UseQueryOptions<GetTokenResp>>) =>
      useQuery<GetTokenResp>({
        ...(options ?? {}),
        queryKey: ["useGetToken"],
        queryFn: ({ signal }) =>
          caller
            .get<GetTokenResp>(`/auth/token`, { signal })
            .then(({ data }) => GetTokenResp.parse(data)),
      }),
  },

  metrics: {
    useGetMetrics: (options?: Partial<UseQueryOptions<GetMetricsResp>>) =>
      useQuery<GetMetricsResp>({
        ...(options ?? {}),
        queryKey: ["useGetMetrics"],
        queryFn: ({ signal }) =>
          caller
            .get<GetMetricsResp>(`/metrics`, { signal })
            .then(({ data }) => GetMetricsResp.parse(data)),
      }),
  },

  example: {
    v1: {
      useGetExample: (options?: Partial<UseQueryOptions<GetExample1Resp>>) =>
        useQuery<GetExample1Resp>({
          ...(options ?? {}),
          queryKey: ["useGetExample"],
          queryFn: ({ signal }) =>
            caller
              .get<GetExample1Resp>(`/api/v1/example`, { signal })
              .then(({ data }) => GetExample1Resp.parse(data)),
        }),
    },
  },

  status: {
    useGetStatus: (options?: Partial<UseQueryOptions<Status>>) =>
      useQuery<Status>({
        ...(options ?? {}),
        queryKey: ["useGetStatus"],
        queryFn: ({ signal }) =>
          caller
            .get<Status>(`/status`, { signal })
            .then(({ data }) => Status.parse(data)),
      }),
  },

  envJs: {
    useGetEnv: (options?: Partial<UseQueryOptions<GetEnvResp>>) =>
      useQuery<GetEnvResp>({
        ...(options ?? {}),
        queryKey: ["useGetEnv"],
        queryFn: ({ signal }) =>
          caller
            .get<GetEnvResp>(`/env.js`, { signal })
            .then(({ data }) => GetEnvResp.parse(data)),
      }),
  },

  FullPath_: {
    useSpa: (params: SpaParams, options?: Partial<UseQueryOptions<SpaResp>>) =>
      useQuery<SpaResp>({
        ...(options ?? {}),
        queryKey: ["useSpa", params],
        queryFn: ({ signal, queryKey }) =>
          caller
            .get<SpaResp>(`/${(queryKey[1] as SpaParams).full_path}`, {
              signal,
            })
            .then(({ data }) => SpaResp.parse(data)),
      }),
  },
};
