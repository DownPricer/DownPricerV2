import requests
import sys
import json
import io
from datetime import datetime
from PIL import Image

class DownPricerAPITester:
    def __init__(self, base_url="http://localhost:8001"):
        self.base_url = base_url
        self.token = None
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_user_id = None
        self.test_demande_id = None
        self.uploaded_image_url = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, use_admin=False):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
            
        if use_admin and self.admin_token:
            test_headers['Authorization'] = f'Bearer {self.admin_token}'
        elif self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_public_settings(self):
        """Test public settings endpoint"""
        success, response = self.run_test(
            "Public Settings",
            "GET",
            "settings/public",
            200
        )
        if success:
            print(f"   Settings: {response}")
            billing_mode = response.get('billing_mode', 'NOT_FOUND')
            print(f"   Billing Mode: {billing_mode}")
        return success

    def test_categories(self):
        """Test categories endpoint"""
        success, response = self.run_test(
            "Categories",
            "GET", 
            "categories",
            200
        )
        if success:
            print(f"   Found {len(response)} categories")
        return success

    def test_articles(self):
        """Test articles listing"""
        success, response = self.run_test(
            "Articles List",
            "GET",
            "articles",
            200
        )
        if success:
            articles = response.get('articles', [])
            total = response.get('total', 0)
            print(f"   Found {len(articles)} articles (total: {total})")
            if articles:
                print(f"   First article: {articles[0].get('name', 'No name')}")
        return success

    def test_signup(self):
        """Test user signup"""
        timestamp = datetime.now().strftime('%H%M%S')
        test_email = f"test_{timestamp}@downpricer.com"
        
        success, response = self.run_test(
            "User Signup",
            "POST",
            "auth/signup",
            200,
            data={
                "email": test_email,
                "password": "test123",
                "first_name": "Test",
                "last_name": "User",
                "phone": "0123456789"
            }
        )
        
        if success and 'token' in response:
            self.token = response['token']
            user = response.get('user', {})
            self.test_user_id = user.get('id')
            print(f"   User ID: {self.test_user_id}")
            print(f"   Roles: {user.get('roles', [])}")
            return True
        return False

    def test_login_existing_user(self):
        """Test login with existing test user"""
        success, response = self.run_test(
            "Login Test User",
            "POST",
            "auth/login",
            200,
            data={
                "email": "test@downpricer.com",
                "password": "test123"
            }
        )
        
        if success and 'token' in response:
            self.token = response['token']
            user = response.get('user', {})
            print(f"   User roles: {user.get('roles', [])}")
            return True
        return False

    def test_admin_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={
                "email": "admin@downpricer.com",
                "password": "admin123"
            }
        )
        
        if success and 'token' in response:
            self.admin_token = response['token']
            user = response.get('user', {})
            print(f"   Admin roles: {user.get('roles', [])}")
            return True
        return False

    def test_auth_me(self):
        """Test current user endpoint"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        if success:
            print(f"   User: {response.get('email')} - Roles: {response.get('roles', [])}")
        return success

    def test_create_demande(self):
        """Test creating a new demande"""
        success, response = self.run_test(
            "Create Demande",
            "POST",
            "demandes",
            200,
            data={
                "name": "Test PlayStation 5",
                "description": "Console de jeu PlayStation 5 en bon état",
                "photos": ["https://example.com/ps5.jpg"],
                "max_price": 450.0,
                "reference_price": 549.99,
                "prefer_delivery": True,
                "prefer_hand_delivery": False
            }
        )
        
        if success:
            self.test_demande_id = response.get('id')
            print(f"   Demande ID: {self.test_demande_id}")
            print(f"   Status: {response.get('status')}")
            print(f"   Deposit: {response.get('deposit_amount')}€")
        return success

    def test_pay_deposit(self):
        """Test paying deposit (FREE_TEST mode)"""
        if not self.test_demande_id:
            print("❌ No demande ID available for deposit payment")
            return False
            
        success, response = self.run_test(
            "Pay Deposit (FREE_TEST)",
            "POST",
            f"demandes/{self.test_demande_id}/pay-deposit",
            200
        )
        
        if success:
            payment = response.get('payment', {})
            print(f"   Payment type: {payment.get('type', 'Unknown')}")
            print(f"   Message: {response.get('message')}")
        return success

    def test_get_demandes(self):
        """Test getting user's demandes"""
        success, response = self.run_test(
            "Get My Demandes",
            "GET",
            "demandes",
            200
        )
        
        if success:
            print(f"   Found {len(response)} demandes")
            if response:
                print(f"   Latest demande status: {response[0].get('status')}")
        return success

    def test_admin_dashboard(self):
        """Test admin dashboard"""
        success, response = self.run_test(
            "Admin Dashboard",
            "GET",
            "admin/dashboard",
            200,
            use_admin=True
        )
        
        if success:
            print(f"   Total users: {response.get('total_users')}")
            print(f"   Total articles: {response.get('total_articles')}")
            print(f"   Total demandes: {response.get('total_demandes')}")
            print(f"   Total sales: {response.get('total_sales')}")
        return success

    def test_seller_request(self):
        """Test seller access request"""
        import requests
        url = f"{self.base_url}/api/seller/request"
        headers = {'Authorization': f'Bearer {self.token}'}
        
        form_data = {
            "first_name": "Test",
            "last_name": "Seller", 
            "email": "testseller@example.com",
            "phone": "0123456789"
        }
        
        self.tests_run += 1
        print(f"\n🔍 Testing Seller Access Request...")
        print(f"   URL: {url}")
        
        try:
            response = requests.post(url, data=form_data, headers=headers)
            success = response.status_code == 200
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                response_data = response.json()
                print(f"   Message: {response_data.get('message')}")
                return True
            else:
                print(f"❌ Failed - Expected 200, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text}")
                return False
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False

    def test_seller_login(self):
        """Test seller login"""
        success, response = self.run_test(
            "Seller Login",
            "POST",
            "auth/login",
            200,
            data={
                "email": "vendeur@downpricer.com",
                "password": "vendeur123"
            }
        )
        
        if success and 'token' in response:
            self.token = response['token']
            user = response.get('user', {})
            print(f"   Seller roles: {user.get('roles', [])}")
            return True
        return False

    def test_seller_stats(self):
        """Test seller stats endpoint"""
        success, response = self.run_test(
            "Seller Stats",
            "GET",
            "seller/stats",
            200
        )
        
        if success:
            print(f"   Total revenue: {response.get('total_revenue', 0)}€")
            print(f"   Total sales: {response.get('total_sales', 0)}")
            print(f"   Total profit: {response.get('total_profit', 0)}€")
            print(f"   Pending payments: {response.get('pending_payments', 0)}")
        return success, response

    def test_seller_articles(self):
        """Test seller articles endpoint"""
        success, response = self.run_test(
            "Seller Articles",
            "GET",
            "seller/articles",
            200
        )
        
        if success and response:
            print(f"   Found {len(response)} articles available for sale")
            if response:
                first_article = response[0]
                print(f"   First article: {first_article.get('name')} - Price: {first_article.get('price')}€")
                return success, first_article
        return success, None

    def test_create_seller_sale(self, article_id, sale_price):
        """Test creating a seller sale"""
        success, response = self.run_test(
            "Create Seller Sale",
            "POST",
            "seller/sales",
            200,
            data={
                "article_id": article_id,
                "sale_price": sale_price
            }
        )
        
        if success:
            sale = response.get('sale', {})
            sale_id = sale.get('id')
            status = sale.get('status')
            profit = sale.get('profit', 0)
            print(f"   Sale ID: {sale_id}")
            print(f"   Status: {status}")
            print(f"   Profit: {profit}€")
            return success, sale_id
        return success, None

    def test_get_seller_sales(self):
        """Test getting seller sales"""
        success, response = self.run_test(
            "Get Seller Sales",
            "GET",
            "seller/sales",
            200
        )
        
        if success:
            print(f"   Found {len(response)} sales")
            if response:
                latest_sale = response[0]
                print(f"   Latest sale status: {latest_sale.get('status')}")
        return success, response

    def test_validate_sale_admin(self, sale_id):
        """Test admin validating a sale"""
        success, response = self.run_test(
            "Admin Validate Sale",
            "POST",
            f"admin/sales/{sale_id}/validate",
            200,
            use_admin=True
        )
        
        if success:
            print(f"   Message: {response.get('message')}")
        return success

    def test_get_seller_sale_detail(self, sale_id):
        """Test getting seller sale detail"""
        success, response = self.run_test(
            "Get Seller Sale Detail",
            "GET",
            f"seller/sales/{sale_id}",
            200
        )
        
        if success:
            sale = response.get('sale', {})
            article = response.get('article', {})
            print(f"   Sale status: {sale.get('status')}")
            print(f"   Article: {article.get('name')}")
            print(f"   Sale price: {sale.get('sale_price')}€")
        return success, response

    def test_submit_payment_proof(self, sale_id):
        """Test submitting payment proof"""
        success, response = self.run_test(
            "Submit Payment Proof",
            "POST",
            f"seller/sales/{sale_id}/submit-payment",
            200,
            data={
                "method": "paypal",
                "proof_url": "https://example.com/paypal-proof.png",
                "note": "Paiement effectué via PayPal",
                "link": ""
            }
        )
        
        if success:
            print(f"   Message: {response.get('message')}")
        return success

    def test_confirm_payment_admin(self, sale_id):
        """Test admin confirming payment"""
        success, response = self.run_test(
            "Admin Confirm Payment",
            "POST",
            f"admin/sales/{sale_id}/confirm-payment",
            200,
            use_admin=True
        )
        
        if success:
            print(f"   Message: {response.get('message')}")
        return success

    def test_complete_seller_payment_workflow(self):
        """Test the complete seller payment workflow"""
        print("\n🔄 TESTING COMPLETE SELLER PAYMENT WORKFLOW")
        
        # Step 1: Login as seller
        print("\n--- Step 1: Login as seller ---")
        if not self.test_seller_login():
            print("❌ Failed to login as seller")
            return False
        
        # Step 2: Check seller stats
        print("\n--- Step 2: Check seller dashboard stats ---")
        stats_success, initial_stats = self.test_seller_stats()
        if not stats_success:
            print("❌ Failed to get seller stats")
            return False
        
        initial_pending = initial_stats.get('pending_payments', 0)
        print(f"   Initial pending payments: {initial_pending}")
        
        # Step 3: Get articles from catalog
        print("\n--- Step 3: Get articles from catalog ---")
        articles_success, article = self.test_seller_articles()
        if not articles_success or not article:
            print("❌ Failed to get articles or no articles available")
            return False
        
        article_id = article.get('id')
        article_price = article.get('price', 0)
        sale_price = article_price + 50  # Add 50€ profit
        
        # Step 4: Create a sale
        print("\n--- Step 4: Create a sale ---")
        sale_success, sale_id = self.test_create_seller_sale(article_id, sale_price)
        if not sale_success or not sale_id:
            print("❌ Failed to create sale")
            return False
        
        # Step 5: Login as admin
        print("\n--- Step 5: Login as admin ---")
        if not self.test_admin_login():
            print("❌ Failed to login as admin")
            return False
        
        # Step 6: Validate the sale
        print("\n--- Step 6: Admin validates the sale ---")
        if not self.test_validate_sale_admin(sale_id):
            print("❌ Failed to validate sale")
            return False
        
        # Step 7: Login back as seller
        print("\n--- Step 7: Login back as seller ---")
        if not self.test_seller_login():
            print("❌ Failed to login back as seller")
            return False
        
        # Step 8: Get sale details and verify status
        print("\n--- Step 8: Get sale details ---")
        detail_success, sale_detail = self.test_get_seller_sale_detail(sale_id)
        if not detail_success:
            print("❌ Failed to get sale details")
            return False
        
        sale_status = sale_detail.get('sale', {}).get('status')
        if sale_status != 'PAYMENT_PENDING':
            print(f"❌ Expected status PAYMENT_PENDING, got {sale_status}")
            return False
        print("✅ Sale status correctly changed to PAYMENT_PENDING")
        
        # Step 9: Submit payment proof
        print("\n--- Step 9: Submit payment proof ---")
        if not self.test_submit_payment_proof(sale_id):
            print("❌ Failed to submit payment proof")
            return False
        
        # Step 10: Verify status changed to PAYMENT_SUBMITTED
        print("\n--- Step 10: Verify status changed to PAYMENT_SUBMITTED ---")
        detail_success, sale_detail = self.test_get_seller_sale_detail(sale_id)
        if not detail_success:
            print("❌ Failed to get sale details after payment submission")
            return False
        
        sale_status = sale_detail.get('sale', {}).get('status')
        if sale_status != 'PAYMENT_SUBMITTED':
            print(f"❌ Expected status PAYMENT_SUBMITTED, got {sale_status}")
            return False
        print("✅ Sale status correctly changed to PAYMENT_SUBMITTED")
        
        # Verify payment proof is stored
        payment_proof = sale_detail.get('sale', {}).get('payment_proof')
        if not payment_proof:
            print("❌ Payment proof not stored")
            return False
        print(f"✅ Payment proof stored: {payment_proof.get('method')} - {payment_proof.get('note')}")
        
        # Step 11: Login as admin again
        print("\n--- Step 11: Login as admin again ---")
        if not self.test_admin_login():
            print("❌ Failed to login as admin")
            return False
        
        # Step 12: Confirm payment
        print("\n--- Step 12: Admin confirms payment ---")
        if not self.test_confirm_payment_admin(sale_id):
            print("❌ Failed to confirm payment")
            return False
        
        # Step 13: Login back as seller and verify final status
        print("\n--- Step 13: Verify final status ---")
        if not self.test_seller_login():
            print("❌ Failed to login back as seller")
            return False
        
        detail_success, sale_detail = self.test_get_seller_sale_detail(sale_id)
        if not detail_success:
            print("❌ Failed to get final sale details")
            return False
        
        final_status = sale_detail.get('sale', {}).get('status')
        if final_status != 'SHIPPING_PENDING':
            print(f"❌ Expected final status SHIPPING_PENDING, got {final_status}")
            return False
        print("✅ Sale status correctly changed to SHIPPING_PENDING")
        
        # Step 14: Verify stats updated
        print("\n--- Step 14: Verify stats updated ---")
        stats_success, final_stats = self.test_seller_stats()
        if not stats_success:
            print("❌ Failed to get final seller stats")
            return False
        
        final_pending = final_stats.get('pending_payments', 0)
        print(f"   Final pending payments: {final_pending}")
        
        print("\n✅ COMPLETE SELLER PAYMENT WORKFLOW PASSED!")
        print("   Status flow: WAITING_ADMIN_APPROVAL → PAYMENT_PENDING → PAYMENT_SUBMITTED → SHIPPING_PENDING")
        print("   Payment proof correctly stored and retrieved")
        print("   All API endpoints working correctly")
        
        return True

    def create_test_image(self):
        """Create a test PNG image in memory"""
        # Create a simple 100x100 red image
        img = Image.new('RGB', (100, 100), color='red')
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='PNG')
        img_bytes.seek(0)
        return img_bytes

    def test_image_upload(self):
        """Test image upload functionality"""
        print("\n🔍 Testing Image Upload...")
        
        # Create test image
        test_image = self.create_test_image()
        
        url = f"{self.base_url}/api/upload/image"
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        files = {'file': ('test_image.png', test_image, 'image/png')}
        
        self.tests_run += 1
        print(f"   URL: {url}")
        
        try:
            response = requests.post(url, files=files, headers=headers)
            success = response.status_code == 200
            
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                response_data = response.json()
                
                # Check response structure
                if response_data.get('success') == True:
                    print("✅ Upload returned success: true")
                else:
                    print("❌ Upload did not return success: true")
                    return False
                
                # Check URL contains "/api/uploads/"
                image_url = response_data.get('url', '')
                if "/api/uploads/" in image_url:
                    print(f"✅ URL contains '/api/uploads/': {image_url}")
                    self.uploaded_image_url = image_url
                else:
                    print(f"❌ URL does not contain '/api/uploads/': {image_url}")
                    return False
                
                return True
            else:
                print(f"❌ Failed - Expected 200, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False

    def test_image_accessibility(self):
        """Test that uploaded image URL is accessible"""
        if not self.uploaded_image_url:
            print("❌ No uploaded image URL available")
            return False
            
        print(f"\n🔍 Testing Image Accessibility...")
        print(f"   URL: {self.uploaded_image_url}")
        
        self.tests_run += 1
        
        try:
            response = requests.get(self.uploaded_image_url)
            success = response.status_code == 200
            
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                print(f"   Content-Type: {response.headers.get('content-type', 'Unknown')}")
                print(f"   Content-Length: {len(response.content)} bytes")
                return True
            else:
                print(f"❌ Failed - Expected 200, got {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False

    def test_create_article_with_image(self):
        """Test creating an article with uploaded image"""
        if not self.uploaded_image_url:
            print("❌ No uploaded image URL available")
            return False
            
        print(f"\n🔍 Testing Create Article with Image...")
        
        article_data = {
            "name": "Test Article avec Image",
            "description": "Article de test créé avec une image uploadée",
            "photos": [self.uploaded_image_url],
            "price": 299.99,
            "reference_price": 399.99,
            "category_id": "test-category",
            "platform_links": {"amazon": "https://example.com/product"},
            "stock": 5
        }
        
        success, response = self.run_test(
            "Create Article with Image",
            "POST",
            "admin/articles",
            200,
            data=article_data,
            use_admin=True
        )
        
        if success:
            article_id = response.get('id')
            photos = response.get('photos', [])
            print(f"   Article ID: {article_id}")
            print(f"   Photos: {photos}")
            
            # Verify the image URL is in the photos array
            if self.uploaded_image_url in photos:
                print("✅ Image URL correctly stored in article photos")
                return True, article_id
            else:
                print("❌ Image URL not found in article photos")
                return False, None
        
        return False, None

    def test_complete_image_upload_workflow(self):
        """Test the complete image upload workflow"""
        print("\n🔄 TESTING COMPLETE IMAGE UPLOAD WORKFLOW")
        
        # Step 1: Login as admin
        print("\n--- Step 1: Login as admin ---")
        if not self.test_admin_login():
            print("❌ Failed to login as admin")
            return False
        
        # Step 2: Upload image
        print("\n--- Step 2: Upload image ---")
        if not self.test_image_upload():
            print("❌ Failed to upload image")
            return False
        
        # Step 3: Test image accessibility
        print("\n--- Step 3: Test image accessibility ---")
        if not self.test_image_accessibility():
            print("❌ Failed to access uploaded image")
            return False
        
        # Step 4: Create article with image
        print("\n--- Step 4: Create article with image ---")
        article_success, article_id = self.test_create_article_with_image()
        if not article_success:
            print("❌ Failed to create article with image")
            return False
        
        print("\n✅ COMPLETE IMAGE UPLOAD WORKFLOW PASSED!")
        print("   ✅ Admin login successful")
        print("   ✅ Image upload returns success: true")
        print("   ✅ Image URL contains '/api/uploads/'")
        print("   ✅ Image URL is accessible (GET returns 200)")
        print("   ✅ Article created with image URL")
        print("   ✅ Image URL correctly stored in article photos")
        
        return True

def main():
    print("🚀 Starting DownPricer API Tests...")
    tester = DownPricerAPITester()
    
    # Test image upload workflow as requested
    print("\n=== IMAGE UPLOAD WORKFLOW ===")
    image_workflow_success = tester.test_complete_image_upload_workflow()
    
    # Print final results
    print(f"\n📊 FINAL RESULTS")
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
    print(f"Success rate: {success_rate:.1f}%")
    
    if image_workflow_success:
        print("✅ IMAGE UPLOAD WORKFLOW: PASSED")
    else:
        print("❌ IMAGE UPLOAD WORKFLOW: FAILED")
    
    return 0 if tester.tests_passed == tester.tests_run and image_workflow_success else 1

if __name__ == "__main__":
    sys.exit(main())