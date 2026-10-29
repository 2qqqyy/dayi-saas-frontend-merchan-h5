import dayjs from "dayjs";

export function formatPrice(value: number) {
  return Number(value).toFixed(1).replace(/\.0$/, "");
}

export function formatMoney(value: number) {
  const num = Number(value || 0);
  const [int, dec] = num.toFixed(2).split(".");
  const intWithComma = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const trimmedDec = dec.replace(/0+$/, "");
  return trimmedDec ? `${intWithComma}.${trimmedDec}` : intWithComma;
}

export function formatDate(value: string | number | Date, pattern = "MM-DD") {
  return dayjs(value).format(pattern);
}

export function formatDateTime(value: string | number | Date, pattern = "YYYY-MM-DD HH:mm") {
  return dayjs(value).format(pattern);
}

export function maskMobile(mobile: string) {
  return mobile.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2");
}
