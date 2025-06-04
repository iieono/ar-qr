"use client";

import { CameraView } from "expo-camera";
import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  Animated,
  Dimensions,
  StatusBar,
  SafeAreaView,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { databases, appwriteConfig } from "../lib/appwrite";

const { width, height } = Dimensions.get("window");

interface Product {
  $id: string;
  name: string;
  description: string;
  price: number;
  productId: string;
  category: string;
  productImage?: string;
  certificateFile?: string;
  createdDate: string;
  expirationDate: string;
  qrCodeUrl: string;
  productUrl: string;
  createdBy: string;
  isHalal: boolean;
}

export default function App() {
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [scanAnimation] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(height));

  useEffect(() => {
    // Continuous scanning animation
    const scanningLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanAnimation, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    scanningLoop.start();

    return () => scanningLoop.stop();
  }, []);

  const fetchProductInfo = async (productId: string) => {
    try {
      setLoading(true);

      const allProducts = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.productCollectionId
      );

      const productData = allProducts.documents.find(
        (product: any) => product.productId === productId
      );

      if (productData) {
        // Properly convert Document to Product interface
        const product: Product = {
          $id: productData.$id,
          name: productData.name || "",
          description: productData.description || "",
          price: productData.price || 0,
          productId: productData.productId || "",
          category: productData.category || "",
          productImage: productData.productImage || "",
          certificateFile: productData.certificateFile || "",
          createdDate: productData.createdDate || new Date().toISOString(),
          expirationDate:
            productData.expirationDate || new Date().toISOString(),
          qrCodeUrl: productData.qrCodeUrl || "",
          productUrl: productData.productUrl || "",
          createdBy: productData.createdBy || "",
          isHalal: productData.isHalal || false,
        };

        setScannedProduct(product);
        setShowResult(true);

        // Animate the modal sliding up
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }).start();
      } else {
        console.error(`Product with ID ${productId} not found.`);
        setScannedProduct(null);
        alert("Product not found");
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      setScannedProduct(null);
      alert("Error fetching product information");
    } finally {
      setLoading(false);
      setScanning(false);
    }
  };

  const handleBarcodeScanned = (result: any) => {
    if (!scanning && !loading && !showResult) {
      setScanning(true);
      const qrData = result.data;
      fetchProductInfo(qrData);
    }
  };

  const handleCloseResult = () => {
    // Animate the modal sliding down
    Animated.spring(slideAnim, {
      toValue: height,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start(() => {
      setShowResult(false);
      setScannedProduct(null);
      setScanning(false);
    });
  };

  const calculateDaysLeft = (expirationDate: string) => {
    if (!expirationDate) return 0;
    const today = new Date();
    const expDate = new Date(expirationDate);
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const openCertificate = () => {
    if (scannedProduct?.certificateFile) {
      Linking.openURL(scannedProduct.certificateFile);
    }
  };

  const getStatusColor = (daysLeft: number) => {
    if (daysLeft < 0) return "#ef4444";
    if (daysLeft <= 30 && daysLeft >= 0) return "#f59e0b";
    return "#10b981";
  };

  const getStatusText = (daysLeft: number) => {
    if (daysLeft < 0) return "EXPIRED";
    if (daysLeft <= 30 && daysLeft >= 0) return "EXPIRING SOON";
    return "VALID";
  };

  const formatPrice = (price: number) => {
    if (!price) return "0.00";
    return price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Camera Scanner */}
      <CameraView
        style={styles.cameraView}
        onBarcodeScanned={handleBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
      />

      {/* Scanner Overlay */}
      <View style={styles.overlay}>
        {/* Top section */}
        <LinearGradient
          colors={["rgba(0,0,0,0.7)", "transparent"]}
          style={styles.topSection}
        >
          <SafeAreaView>
            <View style={styles.topContent}>
              <Text style={styles.instructionTitle}>QR Code Scanner</Text>
              <Text style={styles.instructionText}>
                Position QR code within the frame to scan
              </Text>
            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* Center focus area */}
        <View style={styles.centerSection}>
          <View style={styles.focusFrame}>
            {/* Animated scanning line */}
            <Animated.View
              style={[
                styles.scanLine,
                {
                  transform: [
                    {
                      translateY: scanAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 220],
                      }),
                    },
                  ],
                },
              ]}
            />

            {/* Corner frames */}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
        </View>

        {/* Bottom section */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.7)"]}
          style={styles.bottomSection}
        >
          {loading && (
            <BlurView intensity={20} style={styles.loadingContainer}>
              <View style={styles.loadingContent}>
                <Animated.View
                  style={[
                    styles.loadingSpinner,
                    {
                      transform: [
                        {
                          rotate: scanAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: ["0deg", "360deg"],
                          }),
                        },
                      ],
                    },
                  ]}
                />
                <Text style={styles.loadingText}>Scanning product...</Text>
                <Text style={styles.loadingSubtext}>Please wait</Text>
              </View>
            </BlurView>
          )}

          {scanning && !loading && (
            <BlurView intensity={20} style={styles.scanningContainer}>
              <View style={styles.scanningContent}>
                <Ionicons name="checkmark-circle" size={28} color="#10b981" />
                <Text style={styles.scanningText}>QR Code Detected!</Text>
                <Text style={styles.scanningSubtext}>Processing...</Text>
              </View>
            </BlurView>
          )}

          {!scanning && !loading && (
            <View style={styles.hintContainer}>
              <Ionicons
                name="qr-code-outline"
                size={32}
                color="rgba(255,255,255,0.7)"
              />
              <Text style={styles.hintText}>
                Align QR code within the frame
              </Text>
            </View>
          )}
        </LinearGradient>
      </View>

      {/* Full Screen Product Result Modal */}
      <Modal
        visible={showResult}
        animationType="none"
        transparent={true}
        statusBarTranslucent={true}
        onRequestClose={handleCloseResult}
      >
        <View style={styles.modalContainer}>
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {scannedProduct && (
              <>
                {/* Header with Gradient */}
                <LinearGradient
                  colors={["#667eea", "#764ba2", "#667eea"]}
                  style={styles.resultHeader}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <SafeAreaView>
                    <View style={styles.headerContent}>
                      <TouchableOpacity
                        style={styles.closeButton}
                        onPress={handleCloseResult}
                      >
                        <BlurView intensity={20} style={styles.closeButtonBlur}>
                          <Ionicons name="close" size={24} color="white" />
                        </BlurView>
                      </TouchableOpacity>

                      <Text style={styles.headerTitle}>Product Details</Text>
                      <Text style={styles.headerSubtitle}>
                        Scanned Successfully
                      </Text>

                      <View style={styles.headerBadges}>
                        {(() => {
                          const daysLeft = calculateDaysLeft(
                            scannedProduct.expirationDate
                          );
                          const statusColor = getStatusColor(daysLeft);
                          const statusText = getStatusText(daysLeft);

                          return (
                            <View
                              style={[
                                styles.statusBadge,
                                { backgroundColor: statusColor },
                              ]}
                            >
                              <Ionicons
                                name={
                                  daysLeft < 0
                                    ? "close-circle"
                                    : daysLeft <= 30
                                    ? "warning"
                                    : "checkmark-circle"
                                }
                                size={16}
                                color="white"
                              />
                              <Text style={styles.statusText}>
                                {statusText}
                              </Text>
                            </View>
                          );
                        })()}

                        {/* Halal Badge */}
                        <View
                          style={[
                            styles.halalBadge,
                            {
                              backgroundColor: scannedProduct.isHalal
                                ? "#10b981"
                                : "#6b7280",
                            },
                          ]}
                        >
                          <Ionicons
                            name={
                              scannedProduct.isHalal
                                ? "checkmark-circle"
                                : "close-circle"
                            }
                            size={16}
                            color="white"
                          />
                          <Text style={styles.halalText}>
                            {scannedProduct.isHalal ? "HALAL" : "NOT HALAL"}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </SafeAreaView>
                </LinearGradient>

                <ScrollView
                  style={styles.resultContent}
                  showsVerticalScrollIndicator={false}
                  bounces={true}
                >
                  {/* Product Image */}
                  {scannedProduct.productImage && (
                    <View style={styles.imageContainer}>
                      <Image
                        source={{ uri: scannedProduct.productImage }}
                        style={styles.productImage}
                        resizeMode="cover"
                      />
                      <LinearGradient
                        colors={["transparent", "rgba(0,0,0,0.3)"]}
                        style={styles.imageOverlay}
                      />

                      {/* Halal Overlay Badge */}
                      <View style={styles.imageHalalBadge}>
                        <View
                          style={[
                            styles.halalOverlay,
                            {
                              backgroundColor: scannedProduct.isHalal
                                ? "#10b981"
                                : "#ef4444",
                            },
                          ]}
                        >
                          <Ionicons
                            name={
                              scannedProduct.isHalal
                                ? "checkmark-circle"
                                : "close-circle"
                            }
                            size={20}
                            color="white"
                          />
                          <Text style={styles.halalOverlayText}>
                            {scannedProduct.isHalal ? "HALAL" : "NOT HALAL"}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Product Info Card */}
                  <View style={styles.card}>
                    <View style={styles.cardHeader}>
                      <View style={styles.productTitleContainer}>
                        <Text style={styles.productName}>
                          {scannedProduct.name || "Unknown Product"}
                        </Text>
                        <View style={styles.categoryBadge}>
                          <Ionicons name="pricetag" size={14} color="#6366f1" />
                          <Text style={styles.categoryText}>
                            {scannedProduct.category || "Uncategorized"}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <Text style={styles.description}>
                      {scannedProduct.description || "No description available"}
                    </Text>
                  </View>

                  {/* Price Card */}
                  <View style={styles.card}>
                    <View style={styles.priceHeader}>
                      <Ionicons name="cash-outline" size={24} color="#10b981" />
                      <Text style={styles.priceLabel}>Price</Text>
                    </View>
                    <Text style={styles.price}>
                      {formatPrice(scannedProduct.price)} sum
                    </Text>
                  </View>

                  {/* Product Information Grid */}
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>Product Information</Text>

                    <View style={styles.infoGrid}>
                      {/* Product ID */}
                      <View style={styles.infoItem}>
                        <View style={styles.infoIcon}>
                          <Ionicons
                            name="barcode-outline"
                            size={20}
                            color="#6366f1"
                          />
                        </View>
                        <View style={styles.infoContent}>
                          <Text style={styles.infoLabel}>Product ID</Text>
                          <Text style={styles.infoValue}>
                            {scannedProduct.productId}
                          </Text>
                        </View>
                      </View>

                      {/* Halal Status */}
                      <View style={styles.infoItem}>
                        <View
                          style={[
                            styles.infoIcon,
                            {
                              backgroundColor: scannedProduct.isHalal
                                ? "#dcfce7"
                                : "#fee2e2",
                            },
                          ]}
                        >
                          <Ionicons
                            name={
                              scannedProduct.isHalal
                                ? "checkmark-circle-outline"
                                : "close-circle-outline"
                            }
                            size={20}
                            color={
                              scannedProduct.isHalal ? "#16a34a" : "#dc2626"
                            }
                          />
                        </View>
                        <View style={styles.infoContent}>
                          <Text style={styles.infoLabel}>Halal Status</Text>
                          <Text
                            style={[
                              styles.infoValue,
                              {
                                color: scannedProduct.isHalal
                                  ? "#16a34a"
                                  : "#dc2626",
                                fontWeight: "700",
                              },
                            ]}
                          >
                            {scannedProduct.isHalal
                              ? "Halal Certified"
                              : "Not Halal"}
                          </Text>
                        </View>
                      </View>

                      {/* Created Date */}
                      <View style={styles.infoItem}>
                        <View style={styles.infoIcon}>
                          <Ionicons
                            name="calendar-outline"
                            size={20}
                            color="#6366f1"
                          />
                        </View>
                        <View style={styles.infoContent}>
                          <Text style={styles.infoLabel}>Created Date</Text>
                          <Text style={styles.infoValue}>
                            {formatDateTime(scannedProduct.createdDate)}
                          </Text>
                        </View>
                      </View>

                      {/* Expiration Date */}
                      <View style={styles.infoItem}>
                        <View style={styles.infoIcon}>
                          <Ionicons
                            name="time-outline"
                            size={20}
                            color="#f59e0b"
                          />
                        </View>
                        <View style={styles.infoContent}>
                          <Text style={styles.infoLabel}>Expiration Date</Text>
                          <Text style={styles.infoValue}>
                            {formatDateTime(scannedProduct.expirationDate)}
                          </Text>
                        </View>
                      </View>

                      {/* Days Remaining */}
                      <View style={styles.infoItem}>
                        <View
                          style={[
                            styles.infoIcon,
                            {
                              backgroundColor: `${getStatusColor(
                                calculateDaysLeft(scannedProduct.expirationDate)
                              )}20`,
                            },
                          ]}
                        >
                          <Ionicons
                            name="hourglass-outline"
                            size={20}
                            color={getStatusColor(
                              calculateDaysLeft(scannedProduct.expirationDate)
                            )}
                          />
                        </View>
                        <View style={styles.infoContent}>
                          <Text style={styles.infoLabel}>Days Remaining</Text>
                          <Text
                            style={[
                              styles.infoValue,
                              {
                                color: getStatusColor(
                                  calculateDaysLeft(
                                    scannedProduct.expirationDate
                                  )
                                ),
                                fontWeight: "700",
                              },
                            ]}
                          >
                            {(() => {
                              const daysLeft = calculateDaysLeft(
                                scannedProduct.expirationDate
                              );
                              return daysLeft < 0
                                ? "Expired"
                                : `${daysLeft} days`;
                            })()}
                          </Text>
                        </View>
                      </View>

                      {/* Created By */}
                      <View style={styles.infoItem}>
                        <View style={styles.infoIcon}>
                          <Ionicons
                            name="person-outline"
                            size={20}
                            color="#8b5cf6"
                          />
                        </View>
                        <View style={styles.infoContent}>
                          <Text style={styles.infoLabel}>Created By</Text>
                          <Text style={styles.infoValue}>
                            {scannedProduct.createdBy || "Unknown"}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Certificate Card */}
                  {scannedProduct.certificateFile && (
                    <TouchableOpacity
                      style={styles.certificateCard}
                      onPress={openCertificate}
                    >
                      <LinearGradient
                        colors={["#3b82f6", "#1d4ed8"]}
                        style={styles.certificateGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <View style={styles.certificateContent}>
                          <View style={styles.certificateIcon}>
                            <Ionicons
                              name="document-text"
                              size={24}
                              color="white"
                            />
                          </View>
                          <View style={styles.certificateInfo}>
                            <Text style={styles.certificateTitle}>
                              Certificate Available
                            </Text>
                            <Text style={styles.certificateSubtitle}>
                              Tap to view certificate document
                            </Text>
                          </View>
                          <Ionicons
                            name="open-outline"
                            size={20}
                            color="white"
                          />
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}

                  {/* Action Buttons */}
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.scanAgainButton}
                      onPress={handleCloseResult}
                    >
                      <LinearGradient
                        colors={["#667eea", "#764ba2"]}
                        style={styles.buttonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Ionicons
                          name="qr-code-outline"
                          size={20}
                          color="white"
                        />
                        <Text style={styles.buttonText}>
                          Scan Another Product
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.bottomSpacing} />
                </ScrollView>
              </>
            )}
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  cameraView: {
    flex: 1,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "space-between",
  },
  topSection: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  topContent: {
    alignItems: "center",
  },
  instructionTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  instructionText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 16,
    textAlign: "center",
    fontWeight: "500",
  },
  centerSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  focusFrame: {
    width: 250,
    height: 250,
    position: "relative",
  },
  scanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "#10b981",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  corner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderColor: "#10b981",
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 8,
  },
  bottomSection: {
    paddingBottom: 60,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  loadingContainer: {
    borderRadius: 20,
    overflow: "hidden",
  },
  loadingContent: {
    alignItems: "center",
    paddingHorizontal: 30,
    paddingVertical: 20,
  },
  loadingSpinner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: "rgba(16, 185, 129, 0.3)",
    borderTopColor: "#10b981",
    marginBottom: 12,
  },
  loadingText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  loadingSubtext: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
  },
  scanningContainer: {
    borderRadius: 20,
    overflow: "hidden",
  },
  scanningContent: {
    alignItems: "center",
    paddingHorizontal: 30,
    paddingVertical: 20,
  },
  scanningText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 4,
  },
  scanningSubtext: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
  },
  hintContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  hintText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 16,
    marginTop: 12,
    textAlign: "center",
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  resultHeader: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: 0,
    right: 5,
    zIndex: 10,
  },
  closeButtonBlur: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  headerContent: {
    alignItems: "center",
    marginTop: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    marginBottom: 16,
  },
  headerBadges: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  statusText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 6,
  },
  halalBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  halalText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 6,
  },
  resultContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  imageContainer: {
    marginTop: 20,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    position: "relative",
  },
  productImage: {
    width: "100%",
    height: 220,
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  imageHalalBadge: {
    position: "absolute",
    top: 16,
    left: 16,
  },
  halalOverlay: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  halalOverlayText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 4,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    marginBottom: 12,
  },
  productTitleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  productName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    flex: 1,
    marginRight: 12,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    color: "#6366f1",
    fontWeight: "600",
    marginLeft: 4,
  },
  description: {
    fontSize: 16,
    color: "#6b7280",
    lineHeight: 24,
  },
  priceHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 16,
    color: "#6b7280",
    marginLeft: 8,
    fontWeight: "500",
  },
  price: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#10b981",
    textAlign: "center",
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 16,
  },
  infoGrid: {
    gap: 16,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: "#1f2937",
    fontWeight: "600",
  },
  certificateCard: {
    marginTop: 16,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  certificateGradient: {
    padding: 20,
  },
  certificateContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  certificateIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  certificateInfo: {
    flex: 1,
  },
  certificateTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    marginBottom: 4,
  },
  certificateSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },
  qrContainer: {
    alignItems: "center",
  },
  qrCodeWrapper: {
    padding: 16,
    backgroundColor: "#f9fafb",
    borderRadius: 16,
    marginBottom: 16,
  },
  qrCode: {
    width: 160,
    height: 160,
    borderRadius: 8,
  },
  productIdCode: {
    fontSize: 14,
    color: "#6b7280",
    fontFamily: "monospace",
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  urlCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  urlContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  urlIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#f0f0ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  urlInfo: {
    flex: 1,
  },
  urlTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 2,
  },
  urlSubtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
  actionButtons: {
    marginTop: 24,
    gap: 12,
  },
  scanAgainButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 40,
  },
});
