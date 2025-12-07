import http from "k6/http";
import { sleep } from "k6";

export const options = {
  stages: [
    { duration: "10s", target: 100 },
    { duration: "10s", target: 300 },
    { duration: "10s", target: 500 },
    { duration: "20s", target: 0 },
  ],
};

export default function () {
  const url = "http://localhost:8080/api/v1/auth/login";
  const payload = JSON.stringify({
    email: "ghaisanikarin@gmail.com",
    password: "password",
  });

  const params = {
    headers: { "Content-Type": "application/json" },
  };

  http.post(url, payload, params);
  sleep(1);
}
