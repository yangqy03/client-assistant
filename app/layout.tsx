import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "客户顾问沟通助手",
  description: "为每一段关系，找到恰当的表达。虚构奢侈品牌客户顾问工作台。",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
