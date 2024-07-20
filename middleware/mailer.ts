import nodemailer from "nodemailer";
import PDFDocument from "pdfkit-table";
import path from "path";
import fs from "fs";

const createTransporter = async () => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: "ismartdev004@gmail.com",
        pass: "nltd eqfa zzvp zjvo",
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
    await transporter.verify();
    return transporter;
  } catch (error) {
    console.error("Error setting up transporter:", error);
    throw error;
  }
};

const renderInvoice = async (order: any, orderDetail: any) => {
  const invoiceFolderPath = "public/invoices";
  const fileName = `invoice-${order._id}.pdf`;
  const filePath = path.join(invoiceFolderPath, fileName);
  const fontPath = "fonts/Roboto-Regular.ttf";
  const doc = new PDFDocument();
  const writeStream = fs.createWriteStream(filePath);
  doc.pipe(writeStream);

  doc
    .font(fontPath)
    .fontSize(20)
    .text("Hoá đơn thanh toán BSmart", { align: "center" });
  doc.moveDown();
  doc.font(fontPath).text(`Thông tin khách hàng:`);
  doc.font(fontPath).fontSize(12).text(`Tên: ${order.fullname}`);
  doc.font(fontPath).fontSize(12).text(`Địa chỉ: ${order.address}`);
  doc.font(fontPath).fontSize(12).text(`Email: ${order.email}`);
  doc.font(fontPath).fontSize(12).text(`Số điện thoại: ${order.phone}`);
  doc.moveDown();
  doc.font(fontPath).fontSize(16).text(`Thông tin đơn hàng:`);
  doc.moveDown();
  const totalAmount = orderDetail.reduce(
    (total: number, item: any) => total + item.quantity * item.price,
    0
  );
  const table = {
    headers: ["Tên sản phẩm", "Số lượng", "Giá", "Thành tiền"],
    rows: orderDetail.map((item: any) => [
      item.productID.name,
      item.quantity,
      item.price,
      item.quantity * item.price,
    ]),
  };
  table.rows.push(["Tổng tiền", "", "", totalAmount]);
  const tableOptions = {
    prepareHeader: () => doc.font(fontPath).fontSize(12).fillColor("black"),
    prepareRow: () => doc.font(fontPath).fontSize(10).fillColor("black"),
  };
  await doc.table(table, {
    width: 300,
    columnsSize: [200, 100, 100, 100],
    ...tableOptions,
  });
  doc.moveDown();
  doc
    .font(fontPath)
    .text(`Ngày lập hoá đơn: ${order.createdAt}`, { align: "right" });
  // done!
  doc.end();
  return filePath;
};

export default { createTransporter, renderInvoice };
