import "./globals.css";

export const metadata = {
  title: "여행 어떡할려",
  description: "친구들이랑 같이 만드는 여행 체크리스트",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
