import { Subscriber, Observable } from "rxjs";
import { GQLTransactionInterface } from "ardb/lib/faces/gql";
import { JWKInterface } from "arweave/node/lib/wallet";
import Arweave from "arweave";

// Types for the upload function

export interface UploadFunctionReturn {
  data: any;
  tags?: { name: string; value: string }[];
}

export type UploadFunctionSubscriber = Subscriber<UploadFunctionReturn>;

export type UploadFunction = (
  subscriber: UploadFunctionSubscriber,
  pool: string,
  config: any
) => void;

// Types for the validate function

export interface ListenFunctionReturn {
  proposal: string;
  id: string;
  data: any;
  transaction: GQLTransactionInterface;
  block: number;
}

export type ListenFunctionObservable = Observable<ListenFunctionReturn>;

export interface ValidateFunctionReturn {
  proposal: string;
  valid: boolean;
}

export type ValidateFunctionSubscriber = Subscriber<ValidateFunctionReturn>;

export type ValidateFunction = (
  listener: ListenFunctionObservable,
  subscriber: ValidateFunctionSubscriber,
  pool: string,
  config: any
) => void;

// Options in constructor
export interface Options {
  pool: string;
  stake: number;
  jwk: JWKInterface;
  arweave?: Arweave;
}
