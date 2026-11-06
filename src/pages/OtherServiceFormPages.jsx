"use client";

import { useParams } from "react-router-dom";
import OtherServiceForm from "../components/otherServices/OtherServiceForm";

export function NewOtherService() {
  return <OtherServiceForm />;
}

export function EditOtherService() {
  const { id } = useParams();
  return <OtherServiceForm key={id} invoiceId={id} />;
}
