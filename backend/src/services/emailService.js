const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

exports.enviarPinPedido = async ({
  email,
  nombre,
  pin,
  total,
  productos,
  tipo_entrega,
  direccion,
  costo_envio,
}) => {
  if (!email) {
    console.log("⚠️ Cliente sin email, no se envía notificación");
    return { success: false, error: "Sin email" };
  }

  try {
    const productosHTML = productos
      .map(
        (p) => `
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">
                    ${p.cantidad}x ${p.nombre}
                    ${p.talla ? `<br><small style="color:#666;">Talla: ${p.talla}</small>` : ""}
                    ${p.color ? `<br><small style="color:#666;">Color: ${p.color}</small>` : ""}
                </td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">
                    $${(p.cantidad * p.precio_unitario).toFixed(2)}
                </td>
            </tr>
        `,
      )
      .join("");

    const totalFinal = parseFloat(total) + (parseFloat(costo_envio) || 0);

    const html = `
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"><title>Pedido Confirmado</title></head>
            <body style="font-family: Arial, sans-serif; background: #f0f2f5; padding: 20px; margin: 0;">
                <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                    <div style="background: linear-gradient(135deg, #FF6B00, #FF8C3A); padding: 30px; text-align: center; color: white;">
                        <h1 style="margin: 0; font-size: 28px;">🎉 ¡Pedido Confirmado!</h1>
                        <p style="margin: 10px 0 0 0; opacity: 0.9;">Gracias por tu compra, ${nombre}</p>
                    </div>

                    <div style="padding: 30px; text-align: center; background: #FFF7ED; border-bottom: 1px solid #FFE0C7;">
                        <p style="margin: 0 0 10px 0; color: #666; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">
                            TU PIN DE ${tipo_entrega === "domicilio" ? "ENTREGA" : "RETIRO"}
                        </p>
                        <div style="font-size: 56px; font-weight: bold; color: #FF6B00; letter-spacing: 12px; margin: 10px 0;">
                            ${pin}
                        </div>
                        <p style="margin: 10px 0 0 0; color: #999; font-size: 13px;">
                            ${
                              tipo_entrega === "domicilio"
                                ? "Nuestro repartidor te pedirá este PIN al entregar tu pedido."
                                : "Muestra este PIN en la tienda para retirar tu pedido."
                            }
                        </p>
                    </div>

                    <div style="padding: 30px;">
                        <h2 style="margin: 0 0 15px 0; color: #1A2332; font-size: 18px;">📦 Detalles del pedido</h2>
                        <table style="width: 100%; border-collapse: collapse;">${productosHTML}</table>

                        <div style="margin-top: 20px; padding-top: 15px; border-top: 2px solid #eee;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                <span style="color: #666;">Subtotal:</span>
                                <span style="font-weight: bold;">$${parseFloat(total).toFixed(2)}</span>
                            </div>
                            ${
                              costo_envio > 0
                                ? `
                                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                    <span style="color: #666;">Envío a domicilio:</span>
                                    <span style="font-weight: bold;">$${parseFloat(costo_envio).toFixed(2)}</span>
                                </div>
                            `
                                : ""
                            }
                            <div style="display: flex; justify-content: space-between; margin-top: 10px; padding-top: 10px; border-top: 2px solid #FF6B00;">
                                <span style="color: #1A2332; font-size: 18px; font-weight: bold;">TOTAL:</span>
                                <span style="color: #FF6B00; font-size: 24px; font-weight: bold;">$${totalFinal.toFixed(2)}</span>
                            </div>
                        </div>

                        <div style="margin-top: 25px; padding: 20px; background: #f9f9f9; border-radius: 10px;">
                            <h3 style="margin: 0 0 10px 0; color: #1A2332; font-size: 15px;">
                                ${tipo_entrega === "domicilio" ? "🚚 Entrega a domicilio" : "🏪 Retiro en tienda"}
                            </h3>
                            ${
                              tipo_entrega === "domicilio" && direccion
                                ? `
                                <p style="margin: 0; color: #666; font-size: 14px;">
                                    📍 <strong>Dirección:</strong> ${direccion}
                                </p>
                            `
                                : `
                                <p style="margin: 0; color: #666; font-size: 14px;">
                                    📍 Pasa por nuestra tienda con tu PIN para retirar tu pedido.
                                </p>
                            `
                            }
                        </div>
                    </div>

                    <div style="background: #1A2332; padding: 20px; text-align: center; color: #8B9BB0; font-size: 12px;">
                        <p style="margin: 0;">Este correo fue enviado automáticamente. No responder.</p>
                        <p style="margin: 5px 0 0 0;">© ${new Date().getFullYear()} Mi Imperio</p>
                    </div>
                </div>
            </body>
            </html>
        `;

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: `🎉 Tu pedido está confirmado - PIN: ${pin}`,
      html,
    });

    console.log(`✅ Email enviado a ${email}:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Error al enviar email:", error.message);
    return { success: false, error: error.message };
  }
};
