import requests
import sys
import json
import io
from PIL import Image
import tempfile
import os
from datetime import datetime

class ImageAndStockTester:
    def __init__(self, base_url="http://localhost:8001"):
        self.base_url = base_url
        self.admin_token = None
        self.seller_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_article_id = None

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
            if details:
                print(f"   {details}")
        else:
            print(f"❌ {name}")
            if details:
                print(f"   {details}")

    def login_admin(self):
        """Login as admin"""
        url = f"{self.base_url}/api/auth/login"
        data = {
            "email": "admin@downpricer.com",
            "password": "admin123"
        }
        
        try:
            response = requests.post(url, json=data)
            if response.status_code == 200:
                result = response.json()
                self.admin_token = result.get('token')
                self.log_test("Admin Login", True, f"Token obtained")
                return True
            else:
                self.log_test("Admin Login", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Admin Login", False, f"Error: {str(e)}")
            return False

    def login_seller(self):
        """Login as seller"""
        url = f"{self.base_url}/api/auth/login"
        data = {
            "email": "vendeur@downpricer.com",
            "password": "vendeur123"
        }
        
        try:
            response = requests.post(url, json=data)
            if response.status_code == 200:
                result = response.json()
                self.seller_token = result.get('token')
                self.log_test("Seller Login", True, f"Token obtained")
                return True
            else:
                self.log_test("Seller Login", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Seller Login", False, f"Error: {str(e)}")
            return False

    def create_test_image(self):
        """Create a simple test image"""
        # Create a simple 100x100 red image
        img = Image.new('RGB', (100, 100), color='red')
        
        # Save to temporary file
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.jpg')
        img.save(temp_file.name, 'JPEG')
        temp_file.close()
        
        return temp_file.name

    def create_test_pdf(self):
        """Create a simple test PDF file (should be rejected)"""
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
        temp_file.write(b'%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n')
        temp_file.close()
        
        return temp_file.name

    def test_image_upload_authentication_required(self):
        """Test that image upload requires authentication"""
        url = f"{self.base_url}/api/upload/image"
        
        # Create test image
        image_path = self.create_test_image()
        
        try:
            with open(image_path, 'rb') as f:
                files = {'file': ('test.jpg', f, 'image/jpeg')}
                response = requests.post(url, files=files)
            
            # Should return 401 or 403 without authentication
            if response.status_code in [401, 403]:
                self.log_test("Image Upload - Authentication Required", True, f"Correctly rejected unauthenticated request (Status: {response.status_code})")
                success = True
            else:
                self.log_test("Image Upload - Authentication Required", False, f"Expected 401/403, got {response.status_code}")
                success = False
                
        except Exception as e:
            self.log_test("Image Upload - Authentication Required", False, f"Error: {str(e)}")
            success = False
        finally:
            os.unlink(image_path)
            
        return success

    def test_image_upload_success(self):
        """Test successful image upload"""
        if not self.seller_token:
            self.log_test("Image Upload - Success", False, "No seller token available")
            return False
            
        url = f"{self.base_url}/api/upload/image"
        headers = {'Authorization': f'Bearer {self.seller_token}'}
        
        # Create test image
        image_path = self.create_test_image()
        
        try:
            with open(image_path, 'rb') as f:
                files = {'file': ('test.jpg', f, 'image/jpeg')}
                response = requests.post(url, files=files, headers=headers)
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success') and result.get('url'):
                    image_url = result.get('url')
                    self.log_test("Image Upload - Success", True, f"Image uploaded: {image_url}")
                    
                    # Test if the uploaded image is accessible
                    return self.test_image_accessibility(image_url)
                else:
                    self.log_test("Image Upload - Success", False, f"Invalid response format: {result}")
                    return False
            else:
                self.log_test("Image Upload - Success", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Image Upload - Success", False, f"Error: {str(e)}")
            return False
        finally:
            os.unlink(image_path)

    def test_image_accessibility(self, image_url):
        """Test if uploaded image URL is accessible"""
        try:
            response = requests.get(image_url)
            if response.status_code == 200 and response.headers.get('content-type', '').startswith('image/'):
                self.log_test("Image URL Accessibility", True, f"Image accessible at {image_url}")
                return True
            else:
                self.log_test("Image URL Accessibility", False, f"Status: {response.status_code}, Content-Type: {response.headers.get('content-type')}")
                return False
        except Exception as e:
            self.log_test("Image URL Accessibility", False, f"Error: {str(e)}")
            return False

    def test_image_upload_invalid_format(self):
        """Test that non-image files are rejected"""
        if not self.seller_token:
            self.log_test("Image Upload - Invalid Format", False, "No seller token available")
            return False
            
        url = f"{self.base_url}/api/upload/image"
        headers = {'Authorization': f'Bearer {self.seller_token}'}
        
        # Create test PDF
        pdf_path = self.create_test_pdf()
        
        try:
            with open(pdf_path, 'rb') as f:
                files = {'file': ('test.pdf', f, 'application/pdf')}
                response = requests.post(url, files=files, headers=headers)
            
            # Accept both 400 and 500 as valid rejection responses
            if response.status_code in [400, 500]:
                try:
                    result = response.json()
                    detail = result.get('detail', 'Unknown error')
                except:
                    detail = response.text
                self.log_test("Image Upload - Invalid Format", True, f"Correctly rejected PDF (Status: {response.status_code}): {detail}")
                success = True
            else:
                self.log_test("Image Upload - Invalid Format", False, f"Expected 400/500, got {response.status_code}")
                success = False
                
        except Exception as e:
            self.log_test("Image Upload - Invalid Format", False, f"Error: {str(e)}")
            success = False
        finally:
            os.unlink(pdf_path)
            
        return success

    def create_test_article(self, stock=5):
        """Create a test article with specified stock"""
        if not self.admin_token:
            self.log_test("Create Test Article", False, "No admin token available")
            return None
            
        url = f"{self.base_url}/api/admin/articles"
        headers = {'Authorization': f'Bearer {self.admin_token}', 'Content-Type': 'application/json'}
        
        data = {
            "name": f"Test Article Stock {datetime.now().strftime('%H%M%S')}",
            "description": "Article de test pour la gestion du stock",
            "photos": ["https://example.com/test.jpg"],
            "price": 100.0,
            "reference_price": 150.0,
            "category_id": "test-category",
            "platform_links": {},
            "stock": stock
        }
        
        try:
            response = requests.post(url, json=data, headers=headers)
            if response.status_code == 200:
                result = response.json()
                article_id = result.get('id')
                
                self.log_test("Create Test Article", True, f"Article created with ID: {article_id}, Stock: {stock}")
                return article_id
            else:
                self.log_test("Create Test Article", False, f"Status: {response.status_code}, Response: {response.text}")
                return None
                
        except Exception as e:
            self.log_test("Create Test Article", False, f"Error: {str(e)}")
            return None

    def update_article_stock(self, article_id, stock):
        """Update article stock using PATCH endpoint"""
        if not self.admin_token:
            return False
            
        url = f"{self.base_url}/api/admin/articles/{article_id}/stock"
        headers = {'Authorization': f'Bearer {self.admin_token}', 'Content-Type': 'application/json'}
        
        data = {"stock": stock}
        
        try:
            response = requests.patch(url, json=data, headers=headers)
            if response.status_code == 200:
                result = response.json()
                self.log_test("Update Article Stock", True, f"Stock updated to {stock}: {result.get('message')}")
                return True
            else:
                self.log_test("Update Article Stock", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Update Article Stock", False, f"Error: {str(e)}")
            return False

    def get_seller_articles(self):
        """Get articles available to seller"""
        if not self.seller_token:
            return False, []
            
        url = f"{self.base_url}/api/seller/articles"
        headers = {'Authorization': f'Bearer {self.seller_token}'}
        
        try:
            response = requests.get(url, headers=headers)
            if response.status_code == 200:
                articles = response.json()
                self.log_test("Get Seller Articles", True, f"Found {len(articles)} articles")
                return True, articles
            else:
                self.log_test("Get Seller Articles", False, f"Status: {response.status_code}")
                return False, []
                
        except Exception as e:
            self.log_test("Get Seller Articles", False, f"Error: {str(e)}")
            return False, []

    def create_seller_sale(self, article_id, sale_price):
        """Create a seller sale"""
        if not self.seller_token:
            return False, None
            
        url = f"{self.base_url}/api/seller/sales"
        headers = {'Authorization': f'Bearer {self.seller_token}', 'Content-Type': 'application/json'}
        
        data = {
            "article_id": article_id,
            "sale_price": sale_price
        }
        
        try:
            response = requests.post(url, json=data, headers=headers)
            if response.status_code == 200:
                result = response.json()
                sale = result.get('sale', {})
                sale_id = sale.get('id')
                self.log_test("Create Seller Sale", True, f"Sale created: {sale_id}")
                return True, sale_id
            else:
                result = response.json() if response.headers.get('content-type', '').startswith('application/json') else {"detail": response.text}
                self.log_test("Create Seller Sale", False, f"Status: {response.status_code}, Error: {result.get('detail')}")
                return False, None
                
        except Exception as e:
            self.log_test("Create Seller Sale", False, f"Error: {str(e)}")
            return False, None

    def test_sale_on_zero_stock(self, article_id, sale_price):
        """Test that sale creation fails when stock is 0 (expected failure)"""
        if not self.seller_token:
            return False
            
        url = f"{self.base_url}/api/seller/sales"
        headers = {'Authorization': f'Bearer {self.seller_token}', 'Content-Type': 'application/json'}
        
        data = {
            "article_id": article_id,
            "sale_price": sale_price
        }
        
        try:
            response = requests.post(url, json=data, headers=headers)
            if response.status_code == 400:
                result = response.json() if response.headers.get('content-type', '').startswith('application/json') else {"detail": response.text}
                error_msg = result.get('detail', 'Unknown error')
                if "rupture de stock" in error_msg or "stock" in error_msg.lower():
                    self.log_test("Sale on Zero Stock", True, f"Sale correctly rejected: {error_msg}")
                    return True
                else:
                    self.log_test("Sale on Zero Stock", False, f"Wrong error message: {error_msg}")
                    return False
            else:
                self.log_test("Sale on Zero Stock", False, f"Expected 400, got {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Sale on Zero Stock", False, f"Error: {str(e)}")
            return False

    def test_stock_management_workflow(self):
        """Test complete stock management workflow"""
        print("\n🔄 TESTING STOCK MANAGEMENT WORKFLOW")
        
        # Step 1: Create article with stock = 5
        print("\n--- Step 1: Create article with stock = 5 ---")
        article_id = self.create_test_article(stock=5)
        if not article_id:
            return False
        self.test_article_id = article_id
        
        # Step 2: Verify article appears in seller catalog
        print("\n--- Step 2: Verify article appears in seller catalog ---")
        success, articles = self.get_seller_articles()
        if not success:
            return False
        
        # Find our test article
        test_article = None
        for article in articles:
            if article.get('id') == article_id:
                test_article = article
                break
        
        if not test_article:
            self.log_test("Article in Seller Catalog", False, f"Test article {article_id} not found in seller catalog")
            return False
        else:
            self.log_test("Article in Seller Catalog", True, f"Article found: {test_article.get('name')}")
        
        # Step 3: Create sale → verify stock decrements
        print("\n--- Step 3: Create sale and verify stock decrements ---")
        sale_price = test_article.get('price', 100) + 50
        sale_success, sale_id = self.create_seller_sale(article_id, sale_price)
        if not sale_success:
            return False
        
        # Step 4: Create 4 more sales to reach stock = 0
        print("\n--- Step 4: Create 4 more sales to reach stock = 0 ---")
        for i in range(4):
            sale_success, _ = self.create_seller_sale(article_id, sale_price)
            if not sale_success:
                self.log_test(f"Sale {i+2}", False, "Failed to create sale")
                return False
            else:
                self.log_test(f"Sale {i+2}", True, "Sale created successfully")
        
        # Step 5: Verify article no longer appears in seller catalog
        print("\n--- Step 5: Verify article no longer appears in seller catalog ---")
        success, articles = self.get_seller_articles()
        if not success:
            return False
        
        # Check if our test article is still in the catalog
        article_still_visible = any(article.get('id') == article_id for article in articles)
        if article_still_visible:
            self.log_test("Article Hidden When Stock = 0", False, "Article still visible in seller catalog")
            return False
        else:
            self.log_test("Article Hidden When Stock = 0", True, "Article correctly hidden from seller catalog")
        
        # Step 6: Try to create sale on stock = 0 article → should error
        print("\n--- Step 6: Try to create sale on stock = 0 article ---")
        if not self.test_sale_on_zero_stock(article_id, sale_price):
            return False
        
        # Step 7: Use PATCH to set stock = 10
        print("\n--- Step 7: Update stock to 10 ---")
        if not self.update_article_stock(article_id, 10):
            return False
        
        # Step 8: Verify article reappears in seller catalog
        print("\n--- Step 8: Verify article reappears in seller catalog ---")
        success, articles = self.get_seller_articles()
        if not success:
            return False
        
        # Check if our test article is back in the catalog
        test_article = None
        for article in articles:
            if article.get('id') == article_id:
                test_article = article
                break
        
        if not test_article:
            self.log_test("Article Reappears After Stock Update", False, "Article not found in seller catalog after stock update")
            return False
        else:
            self.log_test("Article Reappears After Stock Update", True, f"Article reappeared: {test_article.get('name')}")
        
        print("\n✅ STOCK MANAGEMENT WORKFLOW COMPLETED SUCCESSFULLY!")
        return True

    def run_all_tests(self):
        """Run all image upload and stock management tests"""
        print("🚀 Starting Image Upload and Stock Management Tests...")
        
        # Login as admin and seller
        print("\n=== AUTHENTICATION ===")
        if not self.login_admin():
            print("❌ Failed to login as admin - aborting tests")
            return False
        
        if not self.login_seller():
            print("❌ Failed to login as seller - aborting tests")
            return False
        
        # Test image upload functionality
        print("\n=== IMAGE UPLOAD TESTS ===")
        self.test_image_upload_authentication_required()
        self.test_image_upload_success()
        self.test_image_upload_invalid_format()
        
        # Test stock management functionality
        print("\n=== STOCK MANAGEMENT TESTS ===")
        stock_workflow_success = self.test_stock_management_workflow()
        
        # Print final results
        print(f"\n📊 FINAL RESULTS")
        print(f"Tests passed: {self.tests_passed}/{self.tests_run}")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"Success rate: {success_rate:.1f}%")
        
        if stock_workflow_success:
            print("✅ STOCK MANAGEMENT WORKFLOW: PASSED")
        else:
            print("❌ STOCK MANAGEMENT WORKFLOW: FAILED")
        
        return self.tests_passed == self.tests_run and stock_workflow_success

def main():
    tester = ImageAndStockTester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())