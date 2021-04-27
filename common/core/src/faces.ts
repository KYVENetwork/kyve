import { Subscriber, Observable } from "rxjs";
import { GQLTransactionInterface } from "ardb/lib/faces/gql";

// Types for the upload function

export interface UploadFunctionReturn {
  data: any;
  tags?: { name: string; value: string }[];
}

export type UploadFunctionSubscriber = Subscriber<UploadFunctionReturn>;

export type UploadFunction = (
  subscriber: UploadFunctionSubscriber,
  config: any
) => void;

// Types for the validate function

export interface ListenFunctionReturn {
  id: string;
  transaction: GQLTransactionInterface;
  block: number;
}

export type ListenFunctionObservable = Observable<ListenFunctionReturn>;

export interface ValidateFunctionReturn {
  valid: boolean;
  id: string;
}

export type ValidateFunctionSubscriber = Subscriber<ValidateFunctionReturn>;

export type ValidateFunction = (
  listener: ListenFunctionObservable,
  subscriber: ValidateFunctionSubscriber,
  config: any
) => void;
